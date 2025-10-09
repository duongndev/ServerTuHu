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

router.get('/all', queryValidationRules.pagination, queryValidationRules.search, handleValidationErrors, getAllProducts);
router.get('/search', searchProductByName);
router.get('/featured', getProductsFeatured);
router.get('/sale', getProductsSale);
router.get('/new', getProductsNew);
router.get('/category/:id', paramValidationRules.mongoId, queryValidationRules.pagination, handleValidationErrors, getProductByCategoryId);
// Đảm bảo thứ tự: protect -> authorize -> rate limit -> upload -> validation -> controller
router.post('/create', protect, authorize('admin'), uploadRateLimit, burstProtection, productValidationRules.create, handleValidationErrors, secureUpload.single("file"), validateUploadedFile, createProduct);
router.put('/update/:id', protect, authorize('admin'), uploadRateLimit, burstProtection, productValidationRules.update, handleValidationErrors, secureUpload.single("file"), validateUploadedFile, updateProduct);
router.delete('/delete/:id', protect, authorize('admin'), paramValidationRules.mongoId, handleValidationErrors, deleteProduct);

// Rating endpoints
router.get('/:id/rating-stats', getProductRatingStats);

router.get('/:id', paramValidationRules.mongoId, handleValidationErrors, getProductById);

// Error handler for upload errors
router.use(handleUploadError);

export default router;
