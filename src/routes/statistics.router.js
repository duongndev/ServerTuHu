import express from "express";
const router = express.Router();
import * as statisticsCtrl from "../controllers/statistics.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { burstProtection } from "../middlewares/rateLimiting.middleware.js";

// Bảo vệ tất cả routes (chỉ admin mới được truy cập)
router.use(protect);
router.use(authorize("admin"));

// Thống kê tổng quan
router.get("/overview", burstProtection, statisticsCtrl.getOverviewStatistics);

// Thống kê doanh thu theo thời gian
router.get("/revenue", burstProtection, statisticsCtrl.getRevenueStatistics);

// Thống kê sản phẩm bán chạy
router.get("/top-selling-products", burstProtection, statisticsCtrl.getTopSellingProducts);

// Thống kê khách hàng
router.get("/customers", burstProtection, statisticsCtrl.getCustomerStatistics);

// Thống kê theo danh mục
router.get("/categories", burstProtection, statisticsCtrl.getCategoryStatistics);

export default router;
