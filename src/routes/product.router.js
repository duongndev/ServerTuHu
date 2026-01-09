import express from "express";
const router = express.Router();
import {
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductByCategoryId,
    searchProductByName,
    getProductsFeatured,
    getProductsSale,
    getProductsNew,
    getProductRatingStats
} from '../controllers/product.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { secureUpload, validateUploadedFile, handleUploadError } from "../middlewares/secureUpload.middleware.js";
import { 
  productValidationRules, 
  paramValidationRules,
  queryValidationRules,
  handleValidationErrors 
} from "../middlewares/inputValidation.middleware.js";
import { 
  uploadRateLimit,
  burstProtection 
} from "../middlewares/rateLimiting.middleware.js";

router.get('/all', burstProtection, queryValidationRules.pagination, queryValidationRules.search, handleValidationErrors, getAllProducts);
router.get('/search', burstProtection, searchProductByName);
router.get('/featured', burstProtection, getProductsFeatured);
router.get('/sale', burstProtection, getProductsSale);
router.get('/new', burstProtection, getProductsNew);
router.get('/category/:id', burstProtection, paramValidationRules.mongoId, queryValidationRules.pagination, handleValidationErrors, getProductByCategoryId);
// Đảm bảo thứ tự: protect -> authorize -> rate limit -> upload -> validation -> controller
router.post('/create', protect, authorize('admin'), uploadRateLimit, burstProtection, secureUpload.single("file"), validateUploadedFile, productValidationRules.create, handleValidationErrors, createProduct);
router.put('/update/:id', protect, authorize('admin'), uploadRateLimit, burstProtection, secureUpload.single("file"), validateUploadedFile, productValidationRules.update, handleValidationErrors, updateProduct);
router.delete('/delete/:id', protect, authorize('admin'), burstProtection, paramValidationRules.mongoId, handleValidationErrors, deleteProduct);

// Rating endpoints
router.get('/:id/rating-stats', getProductRatingStats);

router.get('/:id', paramValidationRules.mongoId, handleValidationErrors, getProductById);

// Error handler for upload errors
router.use(handleUploadError);

export default router;
