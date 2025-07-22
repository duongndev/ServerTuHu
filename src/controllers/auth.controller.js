import userModel from "../models/user.model.js";

import {
  hashPassword,
  comparePassword,
  newToken,
  standardResponse,
} from "../utils/utility.function.js";
import OTPModel from "../models/otp.model.js";
import { sendOTPEmail } from "../service/email.service.js";

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return standardResponse(res, 400, {
        success: false,
        message: "Vui lòng nhập email và mật khẩu",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return standardResponse(res, 401, {
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    if (!validateEmail(email)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Email không hợp lệ",
      });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return standardResponse(res, 401, {
        success: false,
        message: "Mật khẩu không chính xác",
      });
    }
    const token = await newToken(user);
    res.cookie('token', token, { httpOnly: true }) // ✅ set cookie JWT
    return standardResponse(res, 200, {
      success: true,
      message: "Đăng nhập thành công",
      data: {
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          status: user.status,
        },
      },
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Đăng ký
const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;
    if (!fullName || !email || !password || !confirmPassword) {
      return standardResponse(res, 400, {
        success: false,
        message: "Thiếu trường bắt buộc",
      });
    }
    if (password !== confirmPassword) {
      return standardResponse(res, 400, {
        success: false,
        message: "Mật khẩu không khớp",
      });
    }
    if (!validateEmail(email)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Email không hợp lệ",
      });
    }
    const existed = await userModel.findOne({ email });
    if (existed) {
      return standardResponse(res, 400, {
        success: false,
        message: "Email đã tồn tại",
      });
    }
    const hashed = await hashPassword(password);
    const newUser = new userModel({ fullName, email, password: hashed });
    await newUser.save();
    return standardResponse(res, 201, {
      success: true,
      message: "Đăng ký thành công",
      data: {
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Đăng xuất
const logout = async (req, res) => {
  try {
    return standardResponse(res, 200, {
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

const updateFCMToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    const userId = req.user.id;

    if (!fcm_token) {
      return standardResponse(res, 400, {
        success: false,
        message: "Vui lòng nhập FCM Token",
      });
    }

    const user = await userModel
      .findByIdAndUpdate(userId, { fcmToken: fcm_token }, { new: true })
      .select("-password");

    if (!user) {
      return standardResponse(res, 404, {
        success: fale,
        message: "Không tìm thấy người dùng",
      });
    }

    return standardResponse(res, 200, {
      success: true,
      message: "Cập nhật FCM Token thành công",
    });
  } catch (err) {
    return standardResponse(res, 500, {
      success: fale,
      message: "Lỗi cập nhật FCM Token",
      error: err.message,
    });
  }
};

// Quên mật khẩu - gửi OTP về email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return standardResponse(res, 400, { success: false, message: "Vui lòng nhập email" });
    }
    if (!validateEmail(email)) {
      return standardResponse(res, 400, { success: false, message: "Email không hợp lệ" });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy người dùng với email này" });
    }
    // Sinh OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 phút
    // Xóa OTP cũ nếu có
    await OTPModel.deleteMany({ email });
    // Lưu OTP mới, có user_id
    await OTPModel.create({ user_id: user._id, email, otp, expiresAt });
    // Gửi email
    await sendOTPEmail(email, otp);
    return standardResponse(res, 200, { success: true, message: "Đã gửi mã OTP về email. Mã có hiệu lực trong 2 phút." });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Xác thực OTP
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return standardResponse(res, 400, { success: false, message: "Vui lòng nhập mã OTP" });
    }
    const otpDoc = await OTPModel.findOne({otp});
    if (!otpDoc) {
      return standardResponse(res, 400, { success: false, message: "Mã OTP không đúng" });
    }
    if (otpDoc.expiresAt < new Date()) {
      await OTPModel.deleteOne({ _id: otpDoc._id });
      return standardResponse(res, 400, { success: false, message: "Mã OTP đã hết hạn" });
    }
    // Xác thực thành công, xóa OTP
    await OTPModel.deleteOne({ _id: otpDoc._id });
    return standardResponse(res, 200, { success: true, message: "Xác thực OTP thành công", user_id: otpDoc.user_id });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

export { login, register, logout, updateFCMToken, forgotPassword, verifyOTP };
