import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import { errorResponse } from './middleware.js';

// CORS configuration
const corsConfig = cors({
  origin: function (origin, callback) {
    // Cho phép requests từ localhost trong development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // Trong production, thêm domain thực tế
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Cho phép requests không có origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
});

// Rate limiting configuration
const createRateLimit = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => {
      // Ưu tiên user ID nếu đã đăng nhập, nếu không thì dùng IP
      return req.user ? `user_${req.user._id}` : req.ip;
    }),
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    },
    skip: (req) => {
      // Skip rate limiting cho admin trong development
      return process.env.NODE_ENV === 'development' && req.user?.role === 'admin';
    }
  });
};

// General rate limiting - 100 requests per 15 minutes
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP, please try again after 15 minutes'
);

// Strict rate limiting for auth endpoints - 5 requests per 15 minutes
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many failed login attempts, please try again after 15 minutes'
);

// Password reset limiter - 3 requests per hour
const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3,
  'Too many password reset requests, please try again after 1 hour'
);

// API limiter for general endpoints - 1000 requests per hour
const apiLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  1000,
  'Too many API requests, please try again after 1 hour'
);

// Upload limiter - 10 uploads per 10 minutes
const uploadLimiter = createRateLimit(
  10 * 60 * 1000, // 10 minutes
  10,
  'Quá nhiều upload, vui lòng thử lại sau 10 phút'
);

// Rate limiter cho search
const searchLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  30,
  'Quá nhiều tìm kiếm, vui lòng thử lại sau 1 phút'
);

// Rate limiter cho cart operations
const cartLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  50,
  'Quá nhiều thao tác giỏ hàng, vui lòng thử lại sau 1 phút'
);

// Rate limiter cho order operations
const orderLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  10,
  'Quá nhiều thao tác đơn hàng, vui lòng thử lại sau 5 phút'
);

// Rate limiter cho review operations
const reviewLimiter = createRateLimit(
  10 * 60 * 1000, // 10 minutes
  5,
  'Quá nhiều đánh giá, vui lòng thử lại sau 10 phút'
);

// Rate limiter cho notification
const notificationLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  20,
  'Quá nhiều thông báo, vui lòng thử lại sau 1 phút'
);

// Rate limiter nghiêm ngặt cho admin operations
const adminLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  100,
  'Quá nhiều thao tác admin, vui lòng thử lại sau 1 phút',
  (req) => `admin_${req.user?._id || req.ip}`
);

// Rate limiter cho payment operations
const paymentLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  3,
  'Quá nhiều thao tác thanh toán, vui lòng thử lại sau 5 phút'
);

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https:", "http:"],
      mediaSrc: ["'self'", "https:", "http:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"]
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// MongoDB injection prevention
const mongoSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Potential NoSQL injection attempt detected: ${key} from IP: ${req.ip}`);
  }
});

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Basic XSS protection for common fields
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/expression\s*\(/gi, '');
  };

  // Recursive function to sanitize nested objects
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      Object.keys(obj).forEach(key => {
        sanitized[key] = sanitizeObject(obj[key]);
      });
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Request size limiter middleware
const requestSizeLimiter = (maxSize = '10mb') => {
  const parseSize = (size) => {
    if (typeof size === 'number') return size;
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    return Math.floor(value * units[unit]);
  };

  const maxBytes = parseSize(maxSize);

  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxBytes) {
      return errorResponse(res, `Request payload size exceeds maximum allowed size of ${maxSize}`, 413);
    }
    
    next();
  };
};

// Request logging for security audit
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log sensitive operations
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/users',
    '/api/dashboard',
    '/api/admin'
  ];
  
  const isSensitive = sensitiveEndpoints.some(endpoint => 
    req.path.startsWith(endpoint)
  );
  
  if (isSensitive) {
    console.log(`[SECURITY AUDIT] ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  }
  
  // Log response time for monitoring
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) { // Log slow requests
      console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.path} - ${duration}ms - IP: ${req.ip}`);
    }
  });
  
  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Trong development, cho phép localhost
    if (process.env.NODE_ENV === 'development') {
      const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      if (localhostIPs.includes(clientIP)) {
        return next();
      }
    }
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    console.warn(`[SECURITY] Blocked request from unauthorized IP: ${clientIP}`);
    return errorResponse(res, 'Access denied', 403);
  };
};

// Request method validation
const allowedMethods = (methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) => {
  return (req, res, next) => {
    if (!methods.includes(req.method)) {
      return errorResponse(res, 'Unsupported HTTP method', 405);
    }
    next();
  };
};

export {
  corsConfig,
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  uploadLimiter,
  searchLimiter,
  cartLimiter,
  orderLimiter,
  reviewLimiter,
  notificationLimiter,
  adminLimiter,
  paymentLimiter,
  securityHeaders,
  mongoSanitizer,
  xssProtection,
  requestSizeLimiter,
  securityLogger,
  ipWhitelist,
  allowedMethods
};