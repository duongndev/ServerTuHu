import express from "express";
import {
  login,
  register,
  logout,
  refreshToken,
  changePassword,
  updateFCMToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { 
  userValidationRules, 
  handleValidationErrors 
} from "../middlewares/inputValidation.middleware.js";
import { 
  authRateLimit, 
  passwordResetRateLimit,
  burstProtection 
} from "../middlewares/rateLimiting.middleware.js";

const router = express.Router();   

router.post('/register', authRateLimit, burstProtection, userValidationRules.register, handleValidationErrors, register);
router.post('/login', authRateLimit, burstProtection, userValidationRules.login, handleValidationErrors, login);
router.post('/logout', burstProtection, logout);
router.post('/refresh-token', authRateLimit, burstProtection, refreshToken);
router.post('/change-password', passwordResetRateLimit, burstProtection, protect, changePassword);
router.post('/forgot-password', passwordResetRateLimit, burstProtection, forgotPassword);
router.post('/verify-otp', burstProtection, verifyOTP);
router.post('/reset-password', passwordResetRateLimit, burstProtection, resetPassword);
router.post('/update-fcm-token', protect, burstProtection, updateFCMToken);
router.get('/profile', protect, burstProtection, getProfile);


export default router;
