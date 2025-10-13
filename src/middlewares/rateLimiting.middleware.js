import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logSecurityEvent } from '../utils/utility.function.js';

// Store for tracking failed attempts
const failedAttempts = new Map();

// General API rate limiter
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      limit: 'general'
    });
    
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logSecurityEvent(req, 'AUTH_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      limit: 'authentication'
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Password reset rate limiter
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(req, 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      limit: 'password_reset'
    });
    
    res.status(429).json({
      error: 'Too many password reset attempts, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// File upload rate limiter
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(req, 'UPLOAD_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      limit: 'file_upload'
    });
    
    res.status(429).json({
      error: 'Too many file uploads, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// API key rate limiter (for authenticated users)
export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Higher limit for authenticated users
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP with IPv6 support
    return req.user?.id || ipKeyGenerator(req);
  },
  message: {
    error: 'API rate limit exceeded for your account.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(req, 'API_KEY_RATE_LIMIT_EXCEEDED', {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      limit: 'api_key'
    });
    
    res.status(429).json({
      error: 'API rate limit exceeded for your account.',
      retryAfter: '1 hour'
    });
  }
});

// Slow down middleware for progressive delays
export const progressiveSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delay: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  // Note: onLimitReached is deprecated, logging moved to custom middleware
});

// Adaptive rate limiter based on failed attempts
export const adaptiveRateLimit = (req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Clean old entries
  for (const [key, data] of failedAttempts.entries()) {
    if (now - data.firstAttempt > windowMs) {
      failedAttempts.delete(key);
    }
  }
  
  const attempts = failedAttempts.get(clientId);
  
  if (attempts) {
    // Calculate dynamic limit based on failed attempts
    const baseLimit = 100;
    const reductionFactor = Math.min(attempts.count * 0.1, 0.8); // Max 80% reduction
    const dynamicLimit = Math.floor(baseLimit * (1 - reductionFactor));
    
    if (attempts.count >= dynamicLimit) {
      logSecurityEvent(req, 'ADAPTIVE_RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        failedAttempts: attempts.count,
        dynamicLimit
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded due to suspicious activity.',
        retryAfter: '15 minutes'
      });
    }
  }
  
  next();
};

// Track failed authentication attempts
export const trackFailedAttempts = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Check if this is a failed authentication attempt
    if (res.statusCode === 401 || res.statusCode === 403) {
      const clientId = req.ip;
      const now = Date.now();
      
      const attempts = failedAttempts.get(clientId) || {
        count: 0,
        firstAttempt: now
      };
      
      attempts.count++;
      attempts.lastAttempt = now;
      
      failedAttempts.set(clientId, attempts);
      
      logSecurityEvent('FAILED_AUTH_ATTEMPT_TRACKED', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        totalFailedAttempts: attempts.count
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// DDoS protection middleware
export const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Very strict limit for potential DDoS
  message: {
    error: 'Potential DDoS attack detected. Access temporarily blocked.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(req, 'DDOS_PROTECTION_TRIGGERED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      severity: 'HIGH'
    });
    
    res.status(429).json({
      error: 'Potential DDoS attack detected. Access temporarily blocked.',
      retryAfter: '1 minute'
    });
  }
});

// Burst protection for specific endpoints
export const burstProtection = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // Max 10 requests per second 
  message: {
    error: 'Request burst detected. Please slow down.',
    retryAfter: '1 second'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent(req, 'BURST_PROTECTION_TRIGGERED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      error: 'Request burst detected. Please slow down.',
      retryAfter: '1 second'
    });
  }
});

// Clean up failed attempts periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  for (const [key, data] of failedAttempts.entries()) {
    if (now - data.firstAttempt > windowMs) {
      failedAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes