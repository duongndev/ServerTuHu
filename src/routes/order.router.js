import express from "express";
const router = express.Router();
import {
    cancelOrder,
    createOrder,
    getOrdersByStatus,
    getOrdersByUserId,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    getAllOrders
} from "../controllers/order.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

// Bảo vệ các route bên dưới (yêu cầu đăng nhập)
router.use(protect);

// Tạo mới đơn hàng (user)
router.post("/create", authorize("user"), createOrder);

// Lấy danh sách đơn hàng của user đang đăng nhập
router.get("/my-orders", authorize("user"), getOrdersByUserId);

// Lấy chi tiết đơn hàng (user hoặc admin)
router.get("/view/:orderId", authorize("user", "admin"), getOrderById);

// Lấy toàn bộ danh sách order (admin)
router.get("/all", authorize("admin"), getAllOrders);

// Lấy danh sách order theo trạng thái (admin)
router.get("/by-status", authorize("admin"), getOrdersByStatus);

// Cập nhật trạng thái đơn hàng (admin)
router.put("/update/:orderId", authorize("admin"), updateOrderStatus);

// Cập nhật trạng thái thanh toán (user)
router.patch("/payment/:orderId", authorize("user"), updatePaymentStatus);  

// Hủy đơn hàng (user hoặc admin)
router.delete("/cancel", authorize("user", "admin"), cancelOrder);

export default router;
