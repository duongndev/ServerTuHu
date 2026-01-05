import express from 'express';
const router = express.Router();
import * as discountCouponController from '../controllers/discountCoupon.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { burstProtection } from '../middlewares/rateLimiting.middleware.js';

router.post('/create', protect, authorize('admin'), burstProtection, discountCouponController.createCoupon);
router.put('/update/:id', protect, authorize('admin'), burstProtection, discountCouponController.updateCoupon);
router.delete('/delete/:id', protect, authorize('admin'), burstProtection, discountCouponController.deleteCoupon);
router.get('/', protect, authorize('admin'), burstProtection, discountCouponController.getAllCoupons);
router.get('/:id', protect, authorize('admin'), burstProtection, discountCouponController.getCouponById);
router.post('/apply', burstProtection, discountCouponController.applyCoupon);

export default router; 
