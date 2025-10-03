import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
    getOverviewStats,
    getRevenueStats,
    getTopProducts,
    getUserStats,
    getReviewStats,
    getCouponStats,
    getCategoryStats
} from '../controllers/dashboard.controller.js';

// Tất cả routes dashboard chỉ dành cho admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/dashboard/overview
 * @desc    Lấy thống kê tổng quan
 * @access  Admin only
 */
router.get('/overview', getOverviewStats);

/**
 * @route   GET /api/dashboard/revenue
 * @desc    Lấy thống kê doanh thu theo thời gian
 * @query   period (year|month|week), year, month
 * @access  Admin only
 */
router.get('/revenue', getRevenueStats);

/**
 * @route   GET /api/dashboard/products/top
 * @desc    Lấy thống kê sản phẩm bán chạy
 * @query   limit (default: 10)
 * @access  Admin only
 */
router.get('/products/top', getTopProducts);

/**
 * @route   GET /api/dashboard/users
 * @desc    Lấy thống kê người dùng
 * @access  Admin only
 */
router.get('/users', getUserStats);

/**
 * @route   GET /api/dashboard/reviews
 * @desc    Lấy thống kê đánh giá sản phẩm
 * @access  Admin only
 */
router.get('/reviews', getReviewStats);

/**
 * @route   GET /api/dashboard/coupons
 * @desc    Lấy thống kê mã giảm giá
 * @access  Admin only
 */
router.get('/coupons', getCouponStats);

/**
 * @route   GET /api/dashboard/categories
 * @desc    Lấy thống kê theo danh mục sản phẩm
 * @access  Admin only
 */
router.get('/categories', getCategoryStats);

export default router;