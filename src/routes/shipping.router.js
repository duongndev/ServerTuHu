import express from 'express';
const router = express.Router();
import * as shippingController from '../controllers/shipping.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

router.get('/fee/:addressId', protect, shippingController.calculateInternalShippingFee);

export default router; 
