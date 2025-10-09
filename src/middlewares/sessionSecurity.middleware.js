import session from 'express-session';
import MongoStore from 'connect-mongo';
import crypto from 'crypto';
import { logSecurityEvent } from '../utils/utility.function.js';

// Generate secure session secret
const generateSessionSecret = () => {
  return process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
};

// Session configuration
const sessionConfig = {
  secret: generateSessionSecret(),
  name: 'sessionId', // Change default session name
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  },
  store: process.env.MONGO_URI ? MongoStore.create({
    mongoUrl: `${process.env.MONGO_URI}${process.env.DB_NAME}`,
    mongoOptions: {
      auth: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS
      }
    },
    touchAfter: 24 * 3600, // Lazy session update
    crypto: {
      secret: process.env.SESSION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
    },
    autoRemove: 'disabled', // Disable automatic cleanup to avoid index issues
    createIndexes: false, // Disable automatic index creation
    stringify: false, // Use native MongoDB storage
    transformId: (id) => id // Don't transform session IDs
  }) : undefined
};

// Cookie security middleware
const cookieSecurityMiddleware = (req, res, next) => {
  // Set secure cookie defaults
  const originalCookie = res.cookie;
  
  res.cookie = function(name, value, options = {}) {
    const secureOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      ...options
    };
    
    // Log cookie setting for security monitoring
    if (name.includes('token') || name.includes('session') || name.includes('auth')) {
      logSecurityEvent('SECURITY_COOKIE_SET', {
        cookieName: name,
        secure: secureOptions.secure,
        httpOnly: secureOptions.httpOnly,
        sameSite: secureOptions.sameSite
      }, req);
    }
    
    return originalCookie.call(this, name, value, secureOptions);
  };
  
  next();
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  if (req.session) {
    const now = Date.now();
    
    // Check session timeout
    if (req.session.lastActivity && (now - req.session.lastActivity) > (30 * 60 * 1000)) {
      // Session expired (30 minutes of inactivity)
      await logSecurityEvent('SESSION_EXPIRED', {
        sessionId: req.sessionID,
        lastActivity: new Date(req.session.lastActivity),
        userId: req.session.userId
      }, req);
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
      
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }
    
    // Update last activity
    req.session.lastActivity = now;
    
    // Validate session integrity
    if (req.session.userId && req.session.userAgent !== req.get('User-Agent')) {
      // User agent mismatch - possible session hijacking
      await logSecurityEvent('SESSION_HIJACK_ATTEMPT', {
        sessionId: req.sessionID,
        originalUserAgent: req.session.userAgent,
        currentUserAgent: req.get('User-Agent'),
        userId: req.session.userId
      }, req);
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
      
      return res.status(401).json({
        success: false,
        message: 'Session security violation'
      });
    }
    
    // Check IP address consistency (optional - can be disabled for mobile users)
    if (process.env.STRICT_IP_VALIDATION === 'true' && 
        req.session.ipAddress && 
        req.session.ipAddress !== (req.ip || req.connection.remoteAddress)) {
      
      await logSecurityEvent('SESSION_IP_MISMATCH', {
        sessionId: req.sessionID,
        originalIP: req.session.ipAddress,
        currentIP: req.ip || req.connection.remoteAddress,
        userId: req.session.userId
      }, req);
      
      // Don't destroy session for IP mismatch, just log it
      // Mobile users often change IPs
    }
  }
  
  next();
};

// Session creation helper
const createSecureSession = async (req, user) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate(async (err) => {
      if (err) {
        return reject(err);
      }
      
      // Set session data
      req.session.userId = user._id.toString();
      req.session.userRole = user.role;
      req.session.userAgent = req.get('User-Agent');
      req.session.ipAddress = req.ip || req.connection.remoteAddress;
      req.session.lastActivity = Date.now();
      req.session.loginTime = Date.now();
      
      // Save session
      req.session.save(async (err) => {
        if (err) {
          return reject(err);
        }
        
        // Log session creation
        await logSecurityEvent('SESSION_CREATED', {
          sessionId: req.sessionID,
          userId: user._id.toString(),
          userRole: user.role,
          loginTime: new Date()
        }, req);
        
        resolve(req.sessionID);
      });
    });
  });
};

// Session destruction helper
const destroySecureSession = async (req) => {
  return new Promise((resolve) => {
    if (req.session) {
      const sessionData = {
        sessionId: req.sessionID,
        userId: req.session.userId,
        duration: Date.now() - (req.session.loginTime || Date.now())
      };
      
      req.session.destroy(async (err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        
        // Log session destruction
        await logSecurityEvent('SESSION_DESTROYED', sessionData, req);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// Middleware to clear insecure cookies
const clearInsecureCookies = (req, res, next) => {
  // Check if cookies exist before processing
  if (req.cookies && typeof req.cookies === 'object') {
    // List of cookies to clear if they exist without proper security flags
    const cookiesToCheck = ['connect.sid', 'sessionId', 'token', 'auth'];
    
    cookiesToCheck.forEach(cookieName => {
      if (req.cookies[cookieName]) {
        // Clear and reset with secure options
        res.clearCookie(cookieName);
      }
    });
  }
  
  next();
};

// Rate limiting for session operations
const sessionRateLimit = new Map();

const sessionRateLimitMiddleware = async (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10; // Max 10 session operations per window
  
  if (!sessionRateLimit.has(clientId)) {
    sessionRateLimit.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const clientData = sessionRateLimit.get(clientId);
  
  if (now > clientData.resetTime) {
    // Reset window
    sessionRateLimit.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (clientData.count >= maxAttempts) {
    await logSecurityEvent('SESSION_RATE_LIMIT_EXCEEDED', {
      clientId,
      attempts: clientData.count,
      windowMs
    }, req);
    
    return res.status(429).json({
      success: false,
      message: 'Too many session operations. Please try again later.'
    });
  }
  
  clientData.count++;
  next();
};

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of sessionRateLimit.entries()) {
    if (now > data.resetTime) {
      sessionRateLimit.delete(clientId);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export {
  sessionConfig,
  cookieSecurityMiddleware,
  validateSession,
  createSecureSession,
  destroySecureSession,
  clearInsecureCookies,
  sessionRateLimitMiddleware
};