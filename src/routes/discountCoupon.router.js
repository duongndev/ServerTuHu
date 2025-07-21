const router = require('express').Router();
const discountCouponController = require('../controllers/discountCoupon.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.post('/create', protect, authorize('admin'), discountCouponController.createCoupon);
router.put('/update/:id', protect, authorize('admin'), discountCouponController.updateCoupon);
router.delete('/delete/:id', protect, authorize('admin'), discountCouponController.deleteCoupon);
router.get('/all', protect, authorize('admin'), discountCouponController.getAllCoupons);
router.get('/:id', protect, authorize('admin'), discountCouponController.getCouponById);
router.post('/apply', discountCouponController.applyCoupon);

module.exports = router; 