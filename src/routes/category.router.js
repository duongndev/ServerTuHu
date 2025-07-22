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

router.get('/all', getAllCategories);
router.get('/view/:id', getCategoryById);
router.post('/create', protect, authorize('admin'), createCategory);
router.put('/update/:id', protect, authorize('admin'), updateCategory);
router.delete('/delete/:id', protect, authorize('admin'), deleteCategory);

export default router; 
