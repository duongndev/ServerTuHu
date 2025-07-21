const router = require('express').Router();
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/all', categoryController.getAllCategories);
router.get('/view/:id', categoryController.getCategoryById);
router.post('/create', protect, authorize('admin'), categoryController.createCategory);
router.put('/update/:id', protect, authorize('admin'), categoryController.updateCategory);
router.delete('/delete/:id', protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router; 