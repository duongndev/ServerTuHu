const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require("../middlewares/multerMiddleware");

router.get('/all', productController.getAllProducts);
router.get('/search', productController.searchProductByName);
router.get('/featured', productController.getProductsFeatured);
router.get('/sale', productController.getProductsSale);
router.get('/new', productController.getProductsNew);
router.get('/category/:id', productController.getProductByCategoryId);
// Đảm bảo thứ tự: protect -> authorize -> upload -> controller
router.post('/create', protect, authorize('admin'), upload.single("file"), productController.createProduct);
router.get('/view/:id', productController.getProductById);
router.put('/update/:id', protect, authorize('admin'), upload.single("file"), productController.updateProduct);
router.delete('/delete/:id', protect, authorize('admin'), productController.deleteProduct);

module.exports = router; 