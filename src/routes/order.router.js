const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

// Bảo vệ các route bên dưới (yêu cầu đăng nhập)
router.use(protect);

// Tạo mới đơn hàng (user)
router.post("/create", authorize("user"), orderController.createOrder);

// Lấy danh sách đơn hàng của user đang đăng nhập
router.get("/my-orders", authorize("user"), orderController.getOrdersByUserId);

// Lấy chi tiết đơn hàng (user hoặc admin)
router.get("/view/:orderId", authorize("user", "admin"), orderController.getOrderById);

// Lấy toàn bộ danh sách order (admin)
router.get("/all", authorize("admin"), orderController.getAllOrders);

// Lấy danh sách order theo trạng thái (admin)
router.get("/by-status", authorize("admin"), orderController.getOrdersByStatus);

// Cập nhật trạng thái đơn hàng (admin)
router.put("/update/:orderId", authorize("admin"), orderController.updateOrderStatus);

// Cập nhật trạng thái thanh toán (user)
router.patch("/payment/:orderId", authorize("user"), orderController.updatePaymentStatus);

// Hủy đơn hàng (user hoặc admin)
router.delete("/cancel", authorize("user", "admin"), orderController.cancelOrder);

module.exports = router;
