const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/all', protect, authorize('admin'), userController.getAllUsers);
router.get('/role', protect, authorize('admin'), userController.getUsersByRole);
router.post('/me/avatar', protect, userController.updateAvatar);
router.patch('/password', protect, userController.updateUserPassword);
router.get('/me/info', protect, userController.checkUser);
router.get('/:id', protect, userController.getUserById);
router.put('/:id', protect, userController.updateUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router; 