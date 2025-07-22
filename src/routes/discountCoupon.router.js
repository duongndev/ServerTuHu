import express from 'express';
const router = express.Router();
import * as discountCouponController from '../controllers/discountCoupon.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

router.post('/create', protect, authorize('admin'), discountCouponController.createCoupon);
router.put('/update/:id', protect, authorize('admin'), discountCouponController.updateCoupon);
router.delete('/delete/:id', protect, authorize('admin'), discountCouponController.deleteCoupon);
router.get('/all', protect, authorize('admin'), discountCouponController.getAllCoupons);
router.get('/:id', protect, authorize('admin'), discountCouponController.getCouponById);
router.post('/apply', discountCouponController.applyCoupon);

export default router; 
