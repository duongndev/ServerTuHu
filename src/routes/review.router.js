const router = require('express').Router();
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/create', protect, reviewController.createReview);
router.get('/product/:productId', reviewController.getReviewsByProduct);
router.get('/user/:userId', protect, reviewController.getReviewsByUser);
router.put('/update/:id', protect, reviewController.updateReview);
router.delete('/delete/:id', protect, reviewController.deleteReview);

module.exports = router; 