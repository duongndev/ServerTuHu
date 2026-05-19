import express from "express";
const router = express.Router();
import * as orderCtrl from "../controllers/order.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import {  orderCreationRateLimit } from "../middlewares/rateLimiting.middleware.js";

// Bảo vệ các route bên dưới (yêu cầu đăng nhập)
router.use(protect);

// Tạo mới đơn hàng (user)
router.post("/", authorize("user"), orderCreationRateLimit, orderCtrl.createOrder);

// Lấy danh sách đơn hàng của user đang đăng nhập
router.get("/my-orders", authorize("user"), orderCtrl.getOrdersByUserId);


// Lấy toàn bộ danh sách order (admin)
router.get("/all", authorize("admin"),  orderCtrl.getAllOrders);

// Cập nhật trạng thái đơn hàng (admin)
router.put("/:orderId/status", authorize("admin"),  orderCtrl.updateOrderStatus);

// Cập nhật trạng thái thanh toán (user)
router.patch("/payment/:orderId", authorize("user"),  orderCtrl.updatePaymentStatus);  

// Lấy chi tiết đơn hàng (user hoặc admin)
router.get("/:orderId", authorize("user", "admin"),  orderCtrl.getOrderById);

// Hủy đơn hàng (user hoặc admin)
router.delete("/cancel", authorize("user", "admin"),  orderCtrl.cancelOrder);

export default router;
