import userModel from "../models/user.model.js";
import { standardResponse, hashPassword, logSecurityEvent } from "../utils/utility.function.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";
import AuditLog from "../models/auditLog.model.js";

// Lấy tất cả user (ẩn password)
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password -fcmToken");
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy danh sách user thành công",
      data: users,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy user theo role
const getUsersByRole = async (req, res) => {
  const { role } = req.query;
  if (!role) {
    return standardResponse(res, 400, {
      success: false,
      message: "Thiếu role",
    });
  }
  try {
    const users = await userModel.find({ role }).select("-password");
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy user theo role thành công",
      data: users,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy user theo id
const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select("-password");
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy user",
      });
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy user thành công",
      data: user,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, phone } = req.body;
  if (phone && !/^\d{10,11}$/.test(phone)) {
    return standardResponse(res, 400, {
      success: false,
      message: "Số điện thoại không hợp lệ",
    });
  }
  try {
    const userUpdated = await userModel.findByIdAndUpdate(
      id,
      { fullName, phone },
      { new: true }
    ).select("-password");
    if (!userUpdated) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Log audit event
    await AuditLog.createLog({
      userId: req.user?.id,
      action: 'USER_PROFILE_UPDATED',
      resource: 'User',
      resourceId: id,
      details: {
        updatedFields: { fullName, phone },
        targetUserId: id,
        isOwnProfile: req.user?.id === id
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      severity: 'LOW',
      status: 'SUCCESS',
      apiEndpoint: req.originalUrl,
      httpMethod: req.method
    });

    return standardResponse(res, 200, {
      success: true,
      message: "Cập nhật user thành công",
      data: userUpdated,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Đổi mật khẩu user
const updateUserPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const id = req.user.id;
  try {
    const user = await userModel.findById(id);
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy user",
      });
    }
    if (password !== confirmPassword) {
      return standardResponse(res, 400, {
        success: false,
        message: "Mật khẩu không khớp",
      });
    }
    // Hash mật khẩu trước khi lưu
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();
    return standardResponse(res, 200, {
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    // Trả về thông báo lỗi chung, tránh lộ thông tin nội bộ
    return standardResponse(res, 500, {
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

// Xóa user
const deleteUser = async (req, res) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Log audit event
    await AuditLog.createLog({
      userId: req.user?.id,
      action: 'USER_DELETED',
      resource: 'User',
      resourceId: req.params.id,
      details: {
        deletedUserEmail: user.email,
        deletedUserRole: user.role,
        deletedUserName: user.fullName
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      severity: 'HIGH',
      status: 'SUCCESS',
      apiEndpoint: req.originalUrl,
      httpMethod: req.method
    });

    // Log security event for user deletion
    await logSecurityEvent('USER_DELETED', {
      deletedUserId: req.params.id,
      deletedUserEmail: user.email,
      deletedUserRole: user.role
    }, req);

    return standardResponse(res, 200, {
      success: true,
      message: "Xóa user thành công",
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy thông tin user hiện tại
const checkUser = async (req, res) => {
  const user_id = req.user.id;
  try {
    const user = await userModel.findById(user_id).select("-password");
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy user",
      });
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thông tin user thành công",
      data: user,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật avatar user
const updateAvatar = async (req, res) => {
  const user_id = req.user.id;
  if (!req.files || req.files.length === 0) {
    return standardResponse(res, 400, {
      success: false,
      message: "Vui lòng tải lên hình ảnh",
    });
  }
  const file = req.files[0];
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    return standardResponse(res, 400, {
      success: false,
      message: "Chỉ chấp nhận file hình ảnh",
    });
  }
  try {
    const user = await userModel.findById(user_id);
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy user",
      });
    }
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `TuHuBread/users/${user.fullName}/avatar`,
      use_filename: true,
      unique_filename: true,
    });
    const updatedUser = await userModel
      .findByIdAndUpdate(
        user_id,
        { $set: { avatar: result.secure_url } },
        { new: true }
      )
      .select("-password");
    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error("Failed to cleanup uploaded file:", cleanupError);
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Cập nhật avatar thành công",
      data: updatedUser,
    });
  } catch (error) {
    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error(
        "Failed to cleanup uploaded file after error:",
        cleanupError
      );
    }
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};


export {
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  updateUserPassword,
  deleteUser,
  checkUser,
  updateAvatar,
};
