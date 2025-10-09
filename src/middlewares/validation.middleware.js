import { body, validationResult, param, query } from 'express-validator';
import { errorResponse } from './middleware.js';
import { sanitizeInput, validatePassword } from '../utils/utility.function.js';
import AuditLog from '../models/auditLog.model.js';

// Middleware để xử lý kết quả validation
const handleValidationErrors = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: typeof error.value === 'string' ? sanitizeInput(error.value) : error.value
    }));

    // Log validation errors for security monitoring
    await AuditLog.createLog({
      userId: req.user?.id || null,
      action: 'VALIDATION_ERROR',
      details: { 
        endpoint: req.originalUrl,
        method: req.method,
        errors: errorMessages.map(e => ({ field: e.field, message: e.message }))
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      severity: 'MEDIUM',
      status: 'FAILED',
      apiEndpoint: req.originalUrl,
      httpMethod: req.method
    });

    return standardResponse(res, 400, {
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: errorMessages
    });
  }
  next();
};

// Validation rules cho đăng ký
const validateRegister = [
  body('fullName')
    .notEmpty()
    .withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 50 })
    .withMessage('Họ tên phải từ 2-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Họ tên chỉ được chứa chữ cái và khoảng trắng')
    .customSanitizer(value => sanitizeInput(value)),
  
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email không được quá 100 ký tự'),
  
  body('password')
    .custom((value) => {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        throw new Error(`Mật khẩu không đủ mạnh: ${validation.errors.join(', ')}`);
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role không hợp lệ'),
  
  body('phoneNumber')
    .optional()
    .matches(/^(\+84|0)[0-9]{9,10}$/)
    .withMessage('Số điện thoại không hợp lệ (định dạng Việt Nam)'),
  
  handleValidationErrors
];

// Validation rules cho đăng nhập
const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
  
  handleValidationErrors
];

// Validation rules cho FCM token
const validateFCMToken = [
  body('fcm_token')
    .notEmpty()
    .withMessage('FCM token không được để trống')
    .isLength({ min: 10 })
    .withMessage('FCM token không hợp lệ'),
  
  handleValidationErrors
];

// Validation rules cho forgot password
const validateForgotPassword = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  handleValidationErrors
];

// Validation rules cho verify OTP
const validateVerifyOTP = [
  body('otp')
    .notEmpty()
    .withMessage('Mã OTP không được để trống')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải có 6 ký tự')
    .isNumeric()
    .withMessage('Mã OTP chỉ được chứa số'),
  
  handleValidationErrors
];

// Validation rules cho tạo sản phẩm
const validateCreateProduct = [
  body('name')
    .notEmpty()
    .withMessage('Tên sản phẩm không được để trống')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên sản phẩm phải từ 2-200 ký tự'),
  
  body('description')
    .notEmpty()
    .withMessage('Mô tả sản phẩm không được để trống')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Mô tả sản phẩm phải từ 10-2000 ký tự'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Giá sản phẩm phải là số dương'),
  
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá giảm phải là số dương'),
  
  body('category_id')
    .notEmpty()
    .withMessage('Danh mục sản phẩm không được để trống')
    .isMongoId()
    .withMessage('ID danh mục không hợp lệ'),
  
  body('inventory')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng tồn kho phải là số nguyên dương'),
  
  handleValidationErrors
];

// Validation rules cho cập nhật sản phẩm
const validateUpdateProduct = [
  param('id')
    .isMongoId()
    .withMessage('ID sản phẩm không hợp lệ'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên sản phẩm phải từ 2-200 ký tự'),
  
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Mô tả sản phẩm phải từ 10-2000 ký tự'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá sản phẩm phải là số dương'),
  
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá giảm phải là số dương'),
  
  body('category_id')
    .optional()
    .isMongoId()
    .withMessage('ID danh mục không hợp lệ'),
  
  body('inventory')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng tồn kho phải là số nguyên dương'),
  
  handleValidationErrors
];

// Validation rules cho thêm vào giỏ hàng
const validateAddToCart = [
  body('product_id')
    .notEmpty()
    .withMessage('ID sản phẩm không được để trống')
    .isMongoId()
    .withMessage('ID sản phẩm không hợp lệ'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải là số nguyên dương'),
  
  handleValidationErrors
];

// Validation rules cho tạo đơn hàng
const validateCreateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Đơn hàng phải có ít nhất 1 sản phẩm'),
  
  body('items.*.product_id')
    .isMongoId()
    .withMessage('ID sản phẩm không hợp lệ'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải là số nguyên dương'),
  
  body('shippingAddress')
    .notEmpty()
    .withMessage('Địa chỉ giao hàng không được để trống'),
  
  body('paymentMethod')
    .isIn(['cash', 'zalopay', 'momo', 'vnpay'])
    .withMessage('Phương thức thanh toán không hợp lệ'),
  
  body('coupo_code')
    .optional()
    .isString()
    .withMessage('Mã giảm giá không hợp lệ'),
  
  handleValidationErrors
];

// Validation rules cho cập nhật trạng thái đơn hàng
const validateUpdateOrderStatus = [
  param('orderId')
    .isMongoId()
    .withMessage('ID đơn hàng không hợp lệ'),
  
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Trạng thái đơn hàng không hợp lệ'),
  
  handleValidationErrors
];

// Validation rules cho tạo danh mục
const validateCreateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Tên danh mục không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên danh mục phải từ 2-100 ký tự'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả danh mục không được quá 500 ký tự'),
  
  handleValidationErrors
];

// Validation rules cho tạo review
const validateCreateReview = [
  body('product_id')
    .notEmpty()
    .withMessage('ID sản phẩm không được để trống')
    .isMongoId()
    .withMessage('ID sản phẩm không hợp lệ'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Đánh giá phải từ 1-5 sao'),
  
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bình luận không được quá 1000 ký tự'),
  
  handleValidationErrors
];

// Validation rules cho tạo địa chỉ
const validateCreateAddress = [
  body('fullName')
    .notEmpty()
    .withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 50 })
    .withMessage('Họ tên phải từ 2-50 ký tự'),
  
  body('phoneNumber')
    .notEmpty()
    .withMessage('Số điện thoại không được để trống')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('province')
    .notEmpty()
    .withMessage('Tỉnh/thành phố không được để trống'),
  
  body('district')
    .notEmpty()
    .withMessage('Quận/huyện không được để trống'),
  
  body('ward')
    .notEmpty()
    .withMessage('Phường/xã không được để trống'),
  
  body('detailAddress')
    .notEmpty()
    .withMessage('Địa chỉ chi tiết không được để trống')
    .isLength({ min: 5, max: 200 })
    .withMessage('Địa chỉ chi tiết phải từ 5-200 ký tự'),
  
  handleValidationErrors
];

// Validation rules cho tạo mã giảm giá
const validateCreateCoupon = [
  body('code')
    .notEmpty()
    .withMessage('Mã giảm giá không được để trống')
    .isLength({ min: 3, max: 20 })
    .withMessage('Mã giảm giá phải từ 3-20 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã giảm giá chỉ được chứa chữ hoa và số'),
  
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Loại giảm giá không hợp lệ'),
  
  body('discountAmount')
    .isFloat({ min: 0 })
    .withMessage('Số tiền giảm phải là số dương'),
  
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số tiền đơn hàng tối thiểu phải là số dương'),
  
  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số tiền giảm tối đa phải là số dương'),
  
  body('expiryDate')
    .isISO8601()
    .withMessage('Ngày hết hạn không hợp lệ')
    .toDate(),
  
  handleValidationErrors
];

// Validation rules cho cập nhật mật khẩu
const validateUpdatePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation rules cho ObjectId params
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho change password
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),
  
  body('newPassword')
    .custom((value) => {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        throw new Error(`Mật khẩu mới không đủ mạnh: ${validation.errors.join(', ')}`);
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation cho search queries
const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải từ 1-100 ký tự')
    .customSanitizer(value => sanitizeInput(value)),
  
  query('category')
    .optional()
    .isMongoId()
    .withMessage('ID danh mục không hợp lệ'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá tối thiểu phải là số dương'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá tối đa phải là số dương'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng kết quả phải từ 1-100'),
  
  handleValidationErrors
];

// Validation cho file upload
const validateFileUpload = [
  body('fileType')
    .optional()
    .isIn(['image', 'document'])
    .withMessage('Loại file không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Số trang phải từ 1-1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng kết quả phải từ 1-100'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'name', '-name', 'price', '-price'])
    .withMessage('Kiểu sắp xếp không hợp lệ'),
  
  handleValidationErrors
];

// Validation cho admin actions
const validateAdminAction = [
  body('action')
    .isIn(['block', 'unblock', 'delete', 'restore'])
    .withMessage('Hành động không hợp lệ'),
  
  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Lý do phải từ 5-500 ký tự')
    .customSanitizer(value => sanitizeInput(value)),
  
  handleValidationErrors
];

export {
  validateRegister,
  validateLogin,
  validateFCMToken,
  validateForgotPassword,
  validateVerifyOTP,
  validateCreateProduct,
  validateUpdateProduct,
  validateAddToCart,
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateCreateCategory,
  validateCreateReview,
  validateCreateAddress,
  validateCreateCoupon,
  validateUpdatePassword,
  validateChangePassword,
  validateSearch,
  validateFileUpload,
  validatePagination,
  validateAdminAction,
  validateObjectId,
  handleValidationErrors
};