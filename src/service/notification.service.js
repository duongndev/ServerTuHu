const admin = require("../config/firebase.admin.config");
const notificationModel = require("../models/notification.model");
const userModel = require("../models/user.model");

/**
 * Tạo thông báo cho tất cả nhân viên
 * @param {Object} notificationData 
 * @param {string} notificationData.title - Tiêu đề thông báo
 * @param {string} notificationData.message - Nội dung thông báo
 * @param {string} notificationData.type  - Loại thông báo
 * @param {string} notificationData.couponId - Id mã giảm giá
 * @returns 
 */
const sendToAllUsers = async (notificationData) => {
  try {
    const users = await userModel.find({ role: "user" });
    const notifications = [];
    const fcmTokens = [];

    // Tạo thông báo cho nhân viên có fcm
    for (const user of users) {
      if (user.fcmToken) {
        fcmTokens.push(user.fcmToken);
      }

      notifications.push({
        ...notificationData,
        user_id: user._id,
        sender: notificationData.sender || null,
      });
    }

    await notificationModel.insertMany(notifications);

    if (fcmTokens.length > 0) {
      const dataMessage = {
        notification: {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
        },
        data: {
          click_action: "NOTIFICATION_CLICK",
          ...(notificationData.couponId && {
            couponId: notificationData.couponId.toString(),
          }),
        },
        tokens: fcmTokens,
      };

      await admin.messaging().sendEachForMulticast(dataMessage);
    }

    return notifications;
  } catch (error) {
    throw new Error(
      `Lỗi khi gửi thông báo đến tất cả nhân viên: ${error.message}`
    );
  }
};

const sendToUser = async (userId, notificationData) => {
  try {
    const user = await userModel.findOne({
      _id: userId,
      role: "user",
    });
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const notification = new notificationModel({
      ...notificationData,
      user_id: user._id,
      sender: notificationData.sender || null,
    });

    await notification.save();

    if (user.fcmToken) {
      const dataMessage = {
        notification: {
          title: notificationData.title,
          message: notificationData.message,
        },
        data: {
          type: notificationData.type,
          click_action: "NOTIFICATION_CLICK",
          ...(notificationData.orderId && {
            orderId: notificationData.orderId.toString(),
          }),
          ...(notificationData.productId && {
            productId: notificationData.productId.toString(),
          }),
          ...(notificationData.promotionId && {
            promotionId: notificationData.promotionId.toString(),
          }),
        },
        token: user.fcmToken,
      };

      await admin.messaging().send(dataMessage);
    }
  } catch (error) {
    throw new Error(`Lỗi khi gửi thông báo đến người dùng: ${error.message}`);
  }
};

const sendToAdmin = async (notificationData) => {
  try {
    const admins = await userModel.find({ role: "admin" });
    const notifications = [];
    const fcmTokens = [];

    // Tạo thông báo cho admin có fcm
    for (const admin of admins) {
      if (admin.fcmToken) {
        fcmTokens.push(admin.fcmToken);
      }

      notifications.push({
        ...notificationData,
        user_id: admin._id,
        sender: notificationData.sender || null,
      });
    }

    await notificationModel.insertMany(notifications);

    if (fcmTokens.length > 0) {
      const dataMessage = {
        notification: {
          title: notificationData.title,
          message: notificationData.message,
        },
        data: {
          type: notificationData.type,
          click_action: "NOTIFICATION_CLICK",
          ...(notificationData.orderId && {
            orderId: notificationData.orderId.toString(),
          }),
        },
        tokens: fcmTokens,
      };

      await admin.messaging().sendEachForMulticast(dataMessage);
    } else {
      throw new Error(`Không có admin nào có fcmToken`);
    }
  } catch (error) {
    throw new Error(`Lỗi khi gửi thông báo đến admin: ${error.message}`);
  }
};

const sendToBoth = async (userId, adminId, notificationData) => {
  try {
    // Send to user
    const user = await userModel.findOne({
      _id: userId,
      role: "user"
    });
    
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Send to admin
    const admin = await userModel.findOne({
      _id: adminId,
      role: "admin"
    });
    
    if (!admin) {
      throw new Error("Admin không tồn tại");
    }

    // Create notifications
    const notifications = [
      {
        ...notificationData,
        user_id: user._id,
        sender: notificationData.sender || null
      },
      {
        ...notificationData,
        user_id: admin._id,
        sender: notificationData.sender || null
      }
    ];

    await notificationModel.insertMany(notifications);

    // Send FCM notifications if tokens exist
    const fcmTokens = [];
    if (user.fcmToken) fcmTokens.push(user.fcmToken);
    if (admin.fcmToken) fcmTokens.push(admin.fcmToken);

    if (fcmTokens.length > 0) {
      const dataMessage = {
        notification: {
          title: notificationData.title,
          message: notificationData.message
        },
        data: {
          type: notificationData.type,
          click_action: "NOTIFICATION_CLICK",
          ...(notificationData.orderId && {
            orderId: notificationData.orderId.toString()
          }),
        },
        tokens: fcmTokens
      };

      await admin.messaging().sendEachForMulticast(dataMessage);
    }

    return notifications;
  } catch (error) {
    throw new Error(`Lỗi khi gửi thông báo: ${error.message}`);
  }
};

module.exports = {
  sendToAllUsers,
  sendToUser,
  sendToAdmin,
  sendToBoth
};
