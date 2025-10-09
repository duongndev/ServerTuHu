import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Tạo access token (thời gian ngắn)
const newToken = async (user) => {
  return await jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      type: 'access'
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m", // Giảm xuống 15 phút cho bảo mật
    }
  );
};

// Tạo refresh token (thời gian dài)
const newRefreshToken = async (user) => {
  return await jwt.sign(
    { 
      id: user._id, 
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET + '_refresh',
    {
      expiresIn: "7d", // 7 ngày
    }
  );
};

// Verify access token
const verifyToken = async (token) => {
  return await jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
  return await jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET + '_refresh');
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Helper: Chuẩn hóa response trả về
function standardResponse(res, status, { success, message, data = null, pagination = null }) {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(status).json(response);
}

// Helper: Validate email format
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return typeof email === 'string' && emailRegex.test(email);
}

// Helper: Validate password strength
function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 chữ hoa' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 chữ thường' };
  }
  if (!hasNumbers) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 số' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt' };
  }
  
  return { valid: true, message: 'Mật khẩu hợp lệ' };
}

// Helper: Sanitize input để tránh XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Loại bỏ < >
    .replace(/javascript:/gi, '') // Loại bỏ javascript:
    .replace(/on\w+=/gi, '') // Loại bỏ event handlers
    .trim();
}

// Helper: Generate secure random string
function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper: Check if IP is in allowed range
function isIPAllowed(ip, allowedIPs = []) {
  if (allowedIPs.length === 0) return true;
  return allowedIPs.includes(ip);
}

// Helper: Log security events
function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
  
  // Trong production, gửi log này đến service monitoring
  // như ELK Stack, Datadog, etc.
}

export {
  newToken,
  newRefreshToken,
  verifyToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  standardResponse,
  validateEmail,
  validatePassword,
  sanitizeInput,
  generateSecureToken,
  isIPAllowed,
  logSecurityEvent,
};
