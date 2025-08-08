import express from "express";
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAllAsRead,
} from "../controllers/notification.controller.js";
// import { authenticateUser, authorizeRoles } from "../middlewares/auth.middleware.js"; // Nếu cần xác thực và phân quyền

const router = express.Router();

// Tuyến để tạo thông báo mới
router.post("/", createNotification);

// Tuyến để lấy tất cả thông báo (có hỗ trợ phân trang và lọc)
router.get("/", getAllNotifications);

// Tuyến để lấy thông báo theo ID
router.get("/:id", getNotificationById);

// Tuyến để cập nhật thông báo theo ID
router.put("/:id", updateNotification);

// Tuyến để xóa thông báo theo ID
router.delete("/:id", deleteNotification);

// Tuyến để đánh dấu tất cả thông báo là đã đọc
router.put("/mark-all-as-read", markAllAsRead);

export default router;