import BlacklistedToken from "../models/blacklistedToken.model.js";
import { verifyToken, verifyRefreshToken } from "../utils/utility.function.js";
import User from "../models/user.model.js";
import { errorResponse } from "./middleware.js";

// Blacklist token handling

const protect = async (req, res, next) => {
  let token;
  
  // Kiểm tra header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      
      // Kiểm tra token có trong blacklist database không
      const isBlacklisted = await BlacklistedToken.exists({ token });
      if (isBlacklisted) {
        return errorResponse(res, "Token đã bị thu hồi", 401);
      }
      
      const decoded = await verifyToken(token);
      req.user = await User.findById(decoded.id).select("-password");
      
      // Lưu payload để dùng cho logout (cần exp time)
      req.userPayload = decoded;
      
      if (!req.user) {
        return errorResponse(res, "Không tìm thấy người dùng", 401);
      }
      
      // Kiểm tra user có bị khóa không
      if (req.user.isBlocked) {
        return errorResponse(res, "Tài khoản đã bị khóa", 403);
      }
      
      // Lưu token vào req để có thể blacklist sau này
      req.token = token;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, "Token đã hết hạn", 401);
      } else if (error.name === 'JsonWebTokenError') {
        return errorResponse(res, "Token không hợp lệ", 401);
      }
      return errorResponse(res, "Lỗi xác thực", 401);
    }
  } else {
    return errorResponse(res, "Token không được cung cấp", 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Bạn không có quyền truy cập", 403);
    }
    next();
  };
};

// Middleware để logout và blacklist token
const blacklistToken = async (req, res, next) => {
  if (req.token && req.userPayload) {
    try {
      // Tính thời gian hết hạn của token
      // decoded.exp là giây, cần chuyển sang miliseconds
      const expiresAt = new Date(req.userPayload.exp * 1000);
      
      await BlacklistedToken.create({
        token: req.token,
        expiresAt: expiresAt,
        reason: "User logged out"
      });
    } catch (error) {
       console.error("Blacklist token fail:", error);
       // Không chặn flow logout nếu lỗi db, nhưng nên log lại
      return errorResponse(res, "Lỗi khi blacklist token", 500);
    }
  }
  next();
};

// Middleware để refresh token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return errorResponse(res, "Refresh token không được cung cấp", 401);
    }
    
    const decoded = await verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user || user.refreshToken !== refreshToken) {
      return errorResponse(res, "Refresh token không hợp lệ", 401);
    }
    
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Refresh token không hợp lệ", 401);
  }
};

// Middleware kiểm tra quyền sở hữu resource
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return errorResponse(res, "Không tìm thấy tài nguyên", 404);
      }
      
      // Admin có thể truy cập mọi resource
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }
      
      // User chỉ có thể truy cập resource của mình
      if (resource.user_id && resource.user_id.toString() !== req.user._id.toString()) {
        return errorResponse(res, "Bạn không có quyền truy cập tài nguyên này", 403);
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      return errorResponse(res, "Lỗi kiểm tra quyền sở hữu", 500);
    }
  };
};

// Middleware kiểm tra rate limit cho user cụ thể
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Lấy hoặc tạo mảng requests cho user
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }
    
    const requests = userRequests.get(userId);
    
    // Lọc bỏ requests cũ
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return errorResponse(res, "Quá nhiều yêu cầu từ tài khoản này", 429);
    }
    
    // Thêm request hiện tại
    validRequests.push(now);
    userRequests.set(userId, validRequests);
    
    next();
  };
};

export {
  protect,
  authorize,
  blacklistToken,
  refreshToken,
  checkOwnership,
  userRateLimit
};
