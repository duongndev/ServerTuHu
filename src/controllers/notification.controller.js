import notificationModel from "../models/notification.model.js";
import { standardResponse } from "../utils/utility.function.js";
import { sendToAllUsers, sendToUser, sendToAdmin, sendToBoth } from "../service/notification.service.js";

// Tạo thông báo mới
const createNotification = async (req, res) => {
  try {
    const { title, message, type, userId, adminId, orderId, productId, promotionId, couponId } = req.body;

    if (!title || !message || !type) {
      return standardResponse(res, 400, "Vui lòng cung cấp đầy đủ tiêu đề, tin nhắn và loại thông báo.");
    }

    const notificationData = {
      title,
      message,
      type,
      orderId,
      productId,
      promotionId,
      couponId,
    };

    let newNotification;

    if (userId && adminId) {
      // Gửi thông báo cho cả người dùng và admin
      newNotification = await sendToBoth(userId, adminId, notificationData);
    } else if (userId) {
      // Gửi thông báo cho người dùng cụ thể
      newNotification = await sendToUser(userId, notificationData);
    } else if (adminId) {
      // Gửi thông báo cho admin cụ thể (nếu có hàm sendToAdmin nhận adminId)
      // Hiện tại sendToAdmin trong service gửi cho tất cả admin, cần điều chỉnh nếu muốn gửi cho admin cụ thể
      // Tạm thời, nếu adminId được cung cấp, chúng ta sẽ tạo thông báo trong DB và không gửi FCM qua service nếu không có hàm cụ thể
      const newNoti = new notificationModel({
        ...notificationData,
        user_id: adminId,
      });
      newNotification = await newNoti.save();
      // Nếu muốn gửi FCM cho admin cụ thể, cần thêm hàm sendToSpecificAdmin trong notification.service.js
    } else {
      // Gửi thông báo hệ thống (cho tất cả người dùng hoặc không liên kết với người dùng cụ thể)
      newNotification = await sendToAllUsers(notificationData);
    }

    return standardResponse(res, 201, "Thông báo đã được tạo thành công.", newNotification);
  } catch (error) {
    return standardResponse(res, 500, error.message, null, error.stack);
  }
};

// Lấy tất cả thông báo với phân trang và lọc
const getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { userId, type, isRead } = req.query;
    let query = {};

    if (userId) {
      query.user_id = userId;
    }
    if (type) {
      query.type = type;
    }
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const totalNotifications = await notificationModel.countDocuments(query);
    const notifications = await notificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalNotifications / limit);


    return standardResponse(res, 200, {
      success: true,
      message: "Lấy tất cả thông báo với phân trang và lọc.",
      data: notifications,
      pagination: {
        total: totalNotifications,
        page,
        limit,
        totalPages,
      },
    });
   
  } catch (error) {
    return standardResponse(res, 500, error.message, null, error.stack);
  }
};

// Lấy thông báo theo ID
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationModel.findById(id);

    if (!notification) {
      return standardResponse(res, 404, "Không tìm thấy thông báo.");
    }

    return standardResponse(res, 200, "Lấy thông báo thành công.", notification);
  } catch (error) {
    return standardResponse(res, 500, error.message, null, error.stack);
  }
};

// Cập nhật thông báo
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedUpdates = ["title", "message", "type", "isRead", "orderId", "productId", "promotionId", "couponId", "userId", "adminId"];
    const filteredUpdates = {};
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    const existingNotification = await notificationModel.findById(id);
    if (!existingNotification) {
      return standardResponse(res, 404, "Không tìm thấy thông báo để cập nhật.");
    }

    // Apply updates to the existing notification object
    Object.assign(existingNotification, filteredUpdates);

    const updatedNotification = await existingNotification.save();

    // Prepare notification data for FCM
    const notificationData = {
      title: updatedNotification.title,
      message: updatedNotification.message,
      type: updatedNotification.type,
      orderId: updatedNotification.order_id,
      productId: updatedNotification.product_id,
      promotionId: updatedNotification.promotion_id,
      couponId: updatedNotification.coupon_id,
    };

    // Determine which service function to call based on user_id and admin_id
    if (updatedNotification.user_id && updatedNotification.admin_id) {
      // Gửi thông báo cho cả người dùng và admin
      // Lưu ý: sendToBoth trong service cần userId và adminId riêng biệt, không phải từ notification object
      // Cần điều chỉnh service hoặc controller nếu muốn gửi lại cho cả 2 dựa trên ID đã lưu
      // Hiện tại, chỉ cập nhật DB, không gửi lại FCM cho cả 2 qua service này nếu không có logic cụ thể
    } else if (updatedNotification.user_id) {
      // Gửi thông báo cho người dùng cụ thể
      await sendToUser(updatedNotification.user_id, notificationData);
    } else if (updatedNotification.admin_id) {
      // Gửi thông báo cho admin cụ thể (nếu có hàm sendToAdmin nhận adminId)
      // sendToAdmin trong service hiện tại gửi cho tất cả admin, không phải admin cụ thể
      // Nếu muốn gửi cho admin cụ thể, cần thêm hàm sendToSpecificAdmin trong notification.service.js
    } else {
      // Gửi thông báo hệ thống (cho tất cả người dùng hoặc không liên kết với người dùng cụ thể)
      await sendToAllUsers(notificationData);
    }

    return standardResponse(res, 200, "Thông báo đã được cập nhật thành công.", updatedNotification);
  } catch (error) {
    return standardResponse(res, 500, error.message, null, error.stack);
  }
};

// Xóa thông báo
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotification = await notificationModel.findByIdAndDelete(id);

    if (!deletedNotification) {
      return standardResponse(res, 404, "Không tìm thấy thông báo để xóa.");
    }

    return standardResponse(res, 200, "Thông báo đã được xóa thành công.");
  } catch (error) {
    return standardResponse(res, 500, error.message, null, error.stack);
  }
};

// Đánh dấu tất cả thông báo là đã đọc
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body; // Có thể truyền userId để đánh dấu thông báo của một người dùng cụ thể
    let query = {};

    if (userId) {
      query.user_id = userId;
    }

    const result = await notificationModel.updateMany(query, { isRead: true });

    if (result.modifiedCount === 0) {
      return standardResponse(res, 200, "Không có thông báo nào cần cập nhật hoặc đã được đánh dấu là đã đọc.");
    }

    return standardResponse(res, 200, `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc thành công.`);
  } catch (error) {
    return standardResponse(res, 500, error.message, null, error.stack);
  }
};

export {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAllAsRead,
};