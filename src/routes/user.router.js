import express from 'express';
const router = express.Router();
import {
    checkUser,
    getAllUsers,
    getUsersByRole,
    getUserById,
    updateUser,
    updateUserPassword,
    deleteUser,
    updateAvatar
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

router.get('/all', protect, authorize('admin'), getAllUsers);
router.get('/role', protect, authorize('admin'), getUsersByRole);
router.post('/me/avatar', protect, updateAvatar);
router.patch('/password', protect, updateUserPassword);
router.get('/me/info', protect, checkUser);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router; 
