import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';
import xss from 'xss';
import { logSecurityEvent } from '../utils/utility.function.js';

// Create DOMPurify instance for server-side
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Common validation patterns
const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[+]?[\d\s\-\(\)]{10,15}$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  name: /^[a-zA-ZÀ-ỹ\s]{2,50}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

// Sanitization functions
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove XSS attempts
  let sanitized = xss(input, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
  
  // Additional DOMPurify sanitization
  sanitized = purify.sanitize(sanitized, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Escape special characters
  sanitized = validator.escape(sanitized);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Input sanitization middleware
const sanitizeInputs = async (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    await logSecurityEvent('INPUT_SANITIZATION_ERROR', {
      error: error.message,
      body: req.body,
      query: req.query,
      params: req.params
    }, req);
    
    return res.status(500).json({
      success: false,
      message: 'Input processing error'
    });
  }
};

// Validation result handler
const handleValidationErrors = async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    // Log validation failures
    await logSecurityEvent('VALIDATION_FAILED', {
      errors: errorDetails,
      endpoint: req.originalUrl,
      method: req.method
    }, req);
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails
    });
  }
  
  next();
};

// Common validation rules
const userValidationRules = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail({ gmail_remove_dots: false })
      .withMessage('Invalid email format')
      .isLength({ max: 100 })
      .withMessage('Email too long'),
    
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be 8-128 characters')
      .matches(PATTERNS.password)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    
    body('fullName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be 2-50 characters')
      .matches(PATTERNS.name)
      .withMessage('Full name contains invalid characters'),
    
    body('phone')
      .optional()
      .matches(PATTERNS.phone)
      .withMessage('Invalid phone number format')
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail({ gmail_remove_dots: false })
      .withMessage('Invalid email format'),

    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
  ],
  
  updateProfile: [
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be 2-50 characters')
      .matches(PATTERNS.name)
      .withMessage('Full name contains invalid characters'),
    
    body('phone')
      .optional()
      .matches(PATTERNS.phone)
      .withMessage('Invalid phone number format'),
    
    body('address')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Address too long')
  ]
};

const productValidationRules = {
  create: [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be 2-100 characters')
      .matches(/^[a-zA-ZÀ-ỹ0-9\s\-\.]+$/)
      .withMessage('Product name contains invalid characters'),
    
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be 10-1000 characters'),
    
    body('price')
      .isFloat({ min: 0, max: 999999999 })
      .withMessage('Invalid price'),
    
    body('category')
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be 2-50 characters')
      .matches(PATTERNS.alphanumeric)
      .withMessage('Category contains invalid characters'),
    
    body('stock')
      .isInt({ min: 0, max: 999999 })
      .withMessage('Invalid stock quantity')
  ],
  
  update: [
    param('id')
      .matches(PATTERNS.mongoId)
      .withMessage('Invalid product ID'),
    
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be 2-100 characters'),
    
    body('description')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be 10-1000 characters'),
    
    body('price')
      .optional()
      .isFloat({ min: 0, max: 999999999 })
      .withMessage('Invalid price'),
    
    body('stock')
      .optional()
      .isInt({ min: 0, max: 999999 })
      .withMessage('Invalid stock quantity')
  ]
};

const orderValidationRules = {
  create: [
    body('items')
      .isArray({ min: 1, max: 50 })
      .withMessage('Order must contain 1-50 items'),
    
    body('items.*.productId')
      .matches(PATTERNS.mongoId)
      .withMessage('Invalid product ID'),
    
    body('items.*.quantity')
      .isInt({ min: 1, max: 999 })
      .withMessage('Invalid quantity'),
    
    body('shippingAddress.street')
      .isLength({ min: 5, max: 100 })
      .withMessage('Street address must be 5-100 characters'),
    
    body('shippingAddress.city')
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be 2-50 characters'),
    
    body('shippingAddress.zipCode')
      .matches(/^[0-9]{5,10}$/)
      .withMessage('Invalid zip code'),
    
    body('paymentMethod')
      .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'])
      .withMessage('Invalid payment method')
  ]
};

// Parameter validation
const paramValidationRules = {
  mongoId: [
    param('id')
      .matches(PATTERNS.mongoId)
      .withMessage('Invalid ID format')
  ]
};

// Query validation
const queryValidationRules = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Invalid page number'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Invalid limit'),
    
    query('sort')
      .optional()
      .isIn(['asc', 'desc', 'name', 'price', 'createdAt', 'updatedAt'])
      .withMessage('Invalid sort parameter')
  ],
  
  search: [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters')
      .matches(/^[a-zA-ZÀ-ỹ0-9\s\-\.]+$/)
      .withMessage('Search query contains invalid characters')
  ]
};

// SQL injection detection
const detectSQLInjection = async (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i,
    /\b(UNION|SELECT).*?(FROM|WHERE)\b/i
  ];
  
  const checkForSQL = (value) => {
    if (typeof value !== 'string') return false;
    return sqlPatterns.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && checkForSQL(value)) {
        return { detected: true, field: currentPath, value };
      } else if (typeof value === 'object' && value !== null) {
        const result = checkObject(value, currentPath);
        if (result.detected) return result;
      }
    }
    return { detected: false };
  };
  
  try {
    // Check body, query, and params
    const sources = [
      { data: req.body, name: 'body' },
      { data: req.query, name: 'query' },
      { data: req.params, name: 'params' }
    ];
    
    for (const source of sources) {
      if (source.data && typeof source.data === 'object') {
        const result = checkObject(source.data);
        if (result.detected) {
          await logSecurityEvent('SQL_INJECTION_ATTEMPT', {
            source: source.name,
            field: result.field,
            value: result.value,
            endpoint: req.originalUrl,
            method: req.method
          }, req);
          
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
          });
        }
      }
    }
    
    next();
  } catch (error) {
    await logSecurityEvent('SQL_INJECTION_CHECK_ERROR', {
      error: error.message
    }, req);
    
    return res.status(500).json({
      success: false,
      message: 'Input validation error'
    });
  }
};

export {
  sanitizeInputs,
  handleValidationErrors,
  userValidationRules,
  productValidationRules,
  orderValidationRules,
  paramValidationRules,
  queryValidationRules,
  detectSQLInjection,
  sanitizeInput,
  sanitizeObject
};