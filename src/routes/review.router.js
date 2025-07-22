import express from 'express';
const router = express.Router();
import {
    createReview,
    getReviewsByProduct,
    getReviewsByUser,
    updateReview,
    deleteReview
} from '../controllers/review.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

router.post('/create', protect, createReview);
router.get('/product/:productId', getReviewsByProduct);
router.get('/user/:userId', protect, getReviewsByUser);
router.put('/update/:id', protect, updateReview);
router.delete('/delete/:id', protect, deleteReview);

export default router; 
