import express from 'express';
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
    getProductsNew
} from '../controllers/product.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import upload from "../middlewares/multerMiddleware.js";

router.get('/all', getAllProducts);
router.get('/search', searchProductByName);
router.get('/featured', getProductsFeatured);
router.get('/sale', getProductsSale);
router.get('/new', getProductsNew);
router.get('/category/:id', getProductByCategoryId);
// Đảm bảo thứ tự: protect -> authorize -> upload -> controller
router.post('/create', protect, authorize('admin'), upload.single("file"), createProduct);
router.get('/view/:id', getProductById);
router.put('/update/:id', protect, authorize('admin'), upload.single("file"), updateProduct);
router.delete('/delete/:id', protect, authorize('admin'), deleteProduct);

export default router; 
