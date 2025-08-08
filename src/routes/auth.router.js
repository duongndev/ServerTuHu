import express from 'express';
const router = express.Router();
import {
    forgotPassword,
    login,
    logout,
    register,
    updateFCMToken,
    verifyOTP,
    getProfile
} from '../controllers/auth.controller.js';
import { protect } from "../middlewares/auth.middleware.js";   

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post("/update-fcm-token", protect, updateFCMToken);

// Quên mật khẩu - gửi OTP về email
router.post('/forgot-password', forgotPassword);
// Xác thực OTP
router.post('/verify-otp', verifyOTP);

router.get('/profile', protect, getProfile);


export default router; 
