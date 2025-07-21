const router = require('express').Router();
const shippingController = require('../controllers/shipping.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/fee/:addressId', protect, shippingController.calculateInternalShippingFee);

module.exports = router; 