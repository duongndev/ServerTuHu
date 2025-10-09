
/**
 * Standardized response function
 */
function standardResponse(res, status, { success, message, data = null, pagination = null }) {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(status).json(response);
}

/**
 * Success response helper
 */
const successResponse = (res, message = 'Success', data = null, statusCode = 200, meta = null) => {
  return standardResponse(res, statusCode, {
    success: true,
    message,
    data,
    meta
  });
};

/**
 * Error response helper
 */
const errorResponse = (res, message = 'Error', statusCode = 500, data = null) => {
  return standardResponse(res, statusCode, {
    success: false,
    message,
    data
  });
};

/**
 * Created response helper (201)
 */
const createdResponse = (res, message = 'Created', data = null) => {
  return successResponse(res, message, data, 201);
};

/**
 * No content response helper (204)
 */
const noContentResponse = (res) => {
  return res.status(204).end();
};

/**
 * Bad request response helper (400)
 */
const badRequestResponse = (res, message = 'Bad Request', data = null) => {
  return errorResponse(res, message, 400, data);
};

/**
 * Unauthorized response helper (401)
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

/**
 * Forbidden response helper (403)
 */
const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

/**
 * Not found response helper (404)
 */
const notFoundResponse = (res, message = 'Not Found') => {
  return errorResponse(res, message, 404);
};

/**
 * Conflict response helper (409)
 */
const conflictResponse = (res, message = 'Conflict') => {
  return errorResponse(res, message, 409);
};

/**
 * Validation error response helper (422)
 */
const validationErrorResponse = (res, errors, message = 'Validation Error') => {
  return standardResponse(res, 422, {
    success: false,
    message,
    data: { errors }
  });
};

/**
 * Internal server error response helper (500)
 */
const internalServerErrorResponse = (res, message = 'Internal Server Error') => {
  return errorResponse(res, message, 500);
};

/**
 * Legacy sendResponse function for backward compatibility
 * @deprecated Use standardResponse instead
 */
const sendResponse = (statusCode, response, res) => {
  console.warn('[DEPRECATED] sendResponse is deprecated. Use standardResponse instead.');
  
  const isSuccess = statusCode >= 200 && statusCode < 300;
  
  return standardResponse(res, statusCode, {
    success: isSuccess,
    message: response.message || (isSuccess ? 'Success' : 'Error'),
    data: response.data || response
  });
};

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID';
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate key error';
    error = { message, statusCode: 409 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  return errorResponse(res, error.message, error.statusCode || 500);
};

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${logLevel}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Warn for slow requests
    if (duration > 3000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  
  next();
};

/**
 * Request ID middleware
 */
const requestId = (req, res, next) => {
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * CORS middleware
 */
const cors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Body parser size limit middleware
 */
const bodyParserLimit = (limit = '20mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSize = parseSize(limit);
    
    if (contentLength > maxSize) {
      return badRequestResponse(res, `Request body size exceeds limit. Max: ${limit}`);
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
const parseSize = (size) => {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

/**
 * Health check middleware
 */
const healthCheck = (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  return successResponse(res, 'Server is running', healthData);
};

/**
 * API version middleware
 */
const apiVersion = (version = 'v1') => {
  return (req, res, next) => {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    next();
  };
};

/**
 * Cache control middleware
 */
const cacheControl = (maxAge = 3600) => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

/**
 * No cache middleware
 */
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

/**
 * Maintenance mode middleware
 */
const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return standardResponse(res, 503, {
      success: false,
      message: 'System is under maintenance, please try again later.'
    });
  }
  next();
};

/**
 * Request timeout middleware
 */
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        return errorResponse(res, 'Request timeout', 408);
      }
    }, timeout);
    
    res.on('finish', () => {
      clearTimeout(timer);
    });
    
    next();
  };
};

export {
  // Response helpers
  standardResponse,
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  internalServerErrorResponse,
  
  // Legacy
  sendResponse,
  
  // Middleware functions
  notFound,
  errorHandler,
  requestLogger,
  requestId,
  cors,
  bodyParserLimit,
  healthCheck,
  apiVersion,
  cacheControl,
  noCache,
  maintenanceMode,
  requestTimeout,
  
  // Utility functions
  parseSize
};
