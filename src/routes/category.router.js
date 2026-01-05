import express from 'express';
const router = express.Router();
import {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { burstProtection } from '../middlewares/rateLimiting.middleware.js';

router.get('/all', burstProtection, getAllCategories);
router.get('/view/:id', burstProtection, getCategoryById);
router.post('/create', protect, authorize('admin'), burstProtection, createCategory);
router.put('/update/:id', protect, authorize('admin'), burstProtection, updateCategory);
router.delete('/delete/:id', protect, authorize('admin'), burstProtection, deleteCategory);

export default router; 
