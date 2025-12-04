import userModel from "../models/user.model.js";
import {
  hashPassword,
  comparePassword,
  newToken,
  newRefreshToken,
  verifyRefreshToken,
  validateEmail,
  validatePassword,
  logSecurityEvent,
} from "../utils/utility.function.js";
import OTPModel from "../models/otp.model.js";
import { sendOTPEmail } from "../service/email.service.js";
import { standardResponse } from "../middlewares/middleware.js";
import AuditLog from "../models/auditLog.model.js";
import {
  createSecureSession,
  destroySecureSession,
} from "../middlewares/sessionSecurity.middleware.js";

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent") || "Unknown";

    if (!email || !password) {
      // Log failed login attempt
      await AuditLog.createLog({
        action: "LOGIN_FAILED",
        details: { reason: "Missing credentials", email },
        ipAddress,
        userAgent,
        severity: "MEDIUM",
        status: "FAILED",
      });

      return standardResponse(res, 400, {
        success: false,
        message: "Please enter email and password",
      });
    }

    if (!validateEmail(email)) {
      await AuditLog.createLog({
        action: "LOGIN_FAILED",
        details: { reason: "Invalid email format", email },
        ipAddress,
        userAgent,
        severity: "MEDIUM",
        status: "FAILED",
      });

      return standardResponse(res, 400, {
        success: false,
        message: "Invalid email format",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      try {
        await AuditLog.createLog({
          action: "LOGIN_FAILED",
          details: { reason: "User not found", email },
          ipAddress,
          userAgent,
          severity: "MEDIUM",
          status: "FAILED",
        });
      } catch (auditError) {
        console.error("AuditLog creation error:", auditError);
      }

      return standardResponse(res, 401, {
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      await AuditLog.createLog({
        userId: user._id,
        action: "LOGIN_FAILED",
        details: { reason: "Account locked", email },
        ipAddress,
        userAgent,
        severity: "HIGH",
        status: "BLOCKED",
      });

      return standardResponse(res, 423, {
        success: false,
        message:
          "Account is temporarily locked due to too many failed login attempts",
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      await AuditLog.createLog({
        userId: user._id,
        action: "LOGIN_FAILED",
        details: { reason: "Account blocked", email },
        ipAddress,
        userAgent,
        severity: "HIGH",
        status: "BLOCKED",
      });

      return standardResponse(res, 403, {
        success: false,
        message: "Account has been blocked",
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      await AuditLog.createLog({
        userId: user._id,
        action: "LOGIN_FAILED",
        details: {
          reason: "Incorrect password",
          email,
          attempts: user.loginAttempts + 1,
        },
        ipAddress,
        userAgent,
        severity: "MEDIUM",
        status: "FAILED",
      });

      return standardResponse(res, 401, {
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login info
    await user.updateLastLogin(ipAddress, userAgent);

    // Generate tokens
    const accessToken = await newToken(user);
    const refreshToken = await newRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Create secure session
    const sessionId = await createSecureSession(req, user);

    // Set secure cookies

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log successful login
    await AuditLog.createLog({
      userId: user._id,
      action: "LOGIN_SUCCESS",
      details: { email, sessionId },
      ipAddress,
      userAgent,
      severity: "LOW",
      status: "SUCCESS",
    });

    return standardResponse(res, 200, {
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          status: user.status,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    await logSecurityEvent("LOGIN_ERROR", { error: error.message }, req);

    return standardResponse(res, 500, {
      success: false,
      message: "Internal server error",
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
        message: "Please fill in all required fields",
      });
    }
    if (password !== confirmPassword) {
      return standardResponse(res, 400, {
        success: false,
        message: "Passwords do not match",
      });
    }
    if (!validateEmail(email)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Invalid email format",
      });
    }
    const existed = await userModel.findOne({ email });
    if (existed) {
      return standardResponse(res, 400, {
        success: false,
        message: "Email already exists",
      });
    }

    const newUser = new userModel({ fullName, email, password });
    await newUser.save();
    return standardResponse(res, 201, {
      success: true,
      message: "Registration successful",
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
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent") || "Unknown";
    const sessionId = req.sessionID;

    // Clear refresh token from database
    if (userId) {
      await userModel.findByIdAndUpdate(userId, {
        $unset: { refreshToken: 1 },
      });

      // Log logout
      await AuditLog.createLog({
        userId,
        action: "LOGOUT",
        details: { method: "manual", sessionId },
        ipAddress,
        userAgent,
        severity: "LOW",
        status: "SUCCESS",
      });
    }

    // Destroy secure session
    await destroySecureSession(req);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("token"); // Legacy support
    res.clearCookie("sessionId"); // Clear session cookie

    return standardResponse(res, 200, {
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    await logSecurityEvent("LOGOUT_ERROR", { error: error.message }, req);

    return standardResponse(res, 500, {
      success: false,
      message: "Internal server error",
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
        message: "Please enter FCM Token",
      });
    }

    const user = await userModel
      .findByIdAndUpdate(userId, { fcmToken: fcm_token }, { new: true })
      .select("-password");

    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "User not found",
      });
    }

    return standardResponse(res, 200, {
      success: true,
      message: "FCM Token updated successfully",
    });
  } catch (err) {
    return standardResponse(res, 500, {
      success: false,
      message: "Error updating FCM Token",
      error: err.message,
    });
  }
};

// Quên mật khẩu - gửi OTP về email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return standardResponse(res, 400, {
        success: false,
        message: "Please enter email",
      });
    }
    if (!validateEmail(email)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Invalid email format",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "User not found with this email",
      });
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
    return standardResponse(res, 200, {
      success: true,
      message: "OTP sent to email. It is valid for 2 minutes.",
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Xác thực OTP
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return standardResponse(res, 400, {
        success: false,
        message: "Vui lòng nhập mã OTP",
      });
    }
    const otpDoc = await OTPModel.findOne({ otp });
    if (!otpDoc) {
      return standardResponse(res, 400, {
        success: false,
        message: "Mã OTP không đúng",
      });
    }
    if (otpDoc.expiresAt < new Date()) {
      await OTPModel.deleteOne({ _id: otpDoc._id });
      return standardResponse(res, 400, {
        success: false,
        message: "Mã OTP đã hết hạn",
      });
    }
    // Xác thực thành công, xóa OTP
    await OTPModel.deleteOne({ _id: otpDoc._id });
    return standardResponse(res, 200, {
      success: true,
      message: "Xác thực OTP thành công",
      user_id: otpDoc.user_id,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    return standardResponse(res, 200, { success: true, data: user });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.cookies;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent") || "Unknown";

    if (!token) {
      return standardResponse(res, 401, {
        success: false,
        message: "Refresh token not provided",
      });
    }

    // Verify refresh token
    const decoded = await verifyRefreshToken(token);
    if (!decoded) {
      await AuditLog.createLog({
        action: "TOKEN_REFRESH",
        details: { reason: "Invalid refresh token" },
        ipAddress,
        userAgent,
        severity: "MEDIUM",
        status: "FAILED",
      });

      return standardResponse(res, 401, {
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Find user and verify refresh token matches
    const user = await userModel.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      await AuditLog.createLog({
        userId: decoded.id,
        action: "TOKEN_REFRESH",
        details: { reason: "Token mismatch or user not found" },
        ipAddress,
        userAgent,
        severity: "HIGH",
        status: "FAILED",
      });

      return standardResponse(res, 401, {
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      await AuditLog.createLog({
        userId: user._id,
        action: "TOKEN_REFRESH",
        details: { reason: "User blocked" },
        ipAddress,
        userAgent,
        severity: "HIGH",
        status: "BLOCKED",
      });

      return standardResponse(res, 403, {
        success: false,
        message: "Account has been blocked",
      });
    }

    // Generate new tokens
    const newAccessToken = await newToken(user);
    const newRefreshToken = await newRefreshToken(user);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log successful token refresh
    await AuditLog.createLog({
      userId: user._id,
      action: "TOKEN_REFRESH",
      details: { success: true },
      ipAddress,
      userAgent,
      severity: "LOW",
      status: "SUCCESS",
    });

    return standardResponse(res, 200, {
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    await logSecurityEvent(
      "TOKEN_REFRESH_ERROR",
      { error: error.message },
      req
    );

    return standardResponse(res, 500, {
      success: false,
      message: "Internal server error",
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent") || "Unknown";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return standardResponse(res, 400, {
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return standardResponse(res, 400, {
        success: false,
        message: "New passwords do not match",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return standardResponse(res, 400, {
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors,
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      await AuditLog.createLog({
        userId,
        action: "PASSWORD_CHANGE",
        details: { reason: "Invalid current password" },
        ipAddress,
        userAgent,
        severity: "MEDIUM",
        status: "FAILED",
      });

      return standardResponse(res, 401, {
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password and clear refresh token (force re-login)
    await userModel.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      $unset: { refreshToken: 1 },
    });

    // Log password change
    await AuditLog.createLog({
      userId,
      action: "PASSWORD_CHANGE",
      details: { success: true, sessionId: req.sessionID },
      ipAddress,
      userAgent,
      severity: "MEDIUM",
      status: "SUCCESS",
    });

    // Destroy secure session
    await destroySecureSession(req);

    // Clear cookies to force re-login
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("sessionId");

    return standardResponse(res, 200, {
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    await logSecurityEvent(
      "PASSWORD_CHANGE_ERROR",
      { error: error.message },
      req
    );

    return standardResponse(res, 500, {
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  login,
  register,
  logout,
  refreshToken,
  changePassword,
  updateFCMToken,
  forgotPassword,
  verifyOTP,
  getProfile,
};
