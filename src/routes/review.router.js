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
import { burstProtection } from '../middlewares/rateLimiting.middleware.js';

router.post('/create', protect, burstProtection, createReview);
router.get('/product/:productId', burstProtection, getReviewsByProduct);
router.get('/user/:userId', protect, burstProtection, getReviewsByUser);
router.put('/update/:id', protect, burstProtection, updateReview);
router.delete('/delete/:id', protect, burstProtection, deleteReview);

export default router; 
