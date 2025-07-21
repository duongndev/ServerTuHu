const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { protect } = require("../middlewares/auth.middleware");

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post("/update-fcm-token", protect, authController.updateFCMToken);

// Quên mật khẩu - gửi OTP về email
router.post('/forgot-password', authController.forgotPassword);
// Xác thực OTP
router.post('/verify-otp', authController.verifyOTP);


module.exports = router; 