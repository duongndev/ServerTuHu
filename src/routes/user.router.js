import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  checkUser,
  updateAvatar,
} from "../controllers/user.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { 
  secureUpload, 
  validateUploadedFile, 
  handleUploadError 
} from "../middlewares/secureUpload.middleware.js";
import { 
  userValidationRules, 
  paramValidationRules,
  queryValidationRules,
  handleValidationErrors 
} from "../middlewares/inputValidation.middleware.js";
import { 
  uploadRateLimit,
  burstProtection 
} from "../middlewares/rateLimiting.middleware.js";

const router = express.Router();

router.get('/all', protect, authorize('admin'), queryValidationRules.pagination, handleValidationErrors, getAllUsers);
router.get('/me', protect, checkUser);
router.get('/:id', protect, authorize('admin'), paramValidationRules.mongoId, handleValidationErrors, getUserById);
router.put('/update/:id', protect, authorize('admin'), paramValidationRules.mongoId, userValidationRules.updateProfile, handleValidationErrors, updateUser);
router.delete('/delete/:id', protect, authorize('admin'), paramValidationRules.mongoId, handleValidationErrors, deleteUser);
router.put('/me/avatar', protect, uploadRateLimit, burstProtection, secureUpload.array('avatar', 1), validateUploadedFile, updateAvatar);

// Error handler for upload errors
router.use(handleUploadError);

export default router;
