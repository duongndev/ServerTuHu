const discountCouponModel = require("../models/discountCoupon.model");
const { standardResponse } = require("../utils/utility.function");
const { sendToAllUsers } = require("../service/notification.service");

// Tạo mã giảm giá mới
const createCoupon = async (req, res) => {
  try {
    const coupon = new discountCouponModel(req.body);
    await coupon.save();
    // Gửi thông báo cho tất cả user
    try {
      await sendToAllUsers({
        title: "Mã giảm giá mới",
        message: `Mã ${coupon.code} - ${coupon.discountType === "percentage" ? coupon.discountValue + "%" : coupon.discountValue + "đ"} đã được áp dụng!`,
        type: "discountCoupon",
        couponId: coupon._id,
        sender: req.user._id,
      });
    } catch (error) {
      return standardResponse(res, 500, { success: false, message: "Lỗi khi gửi thông báo", error: error.message });
    }
    return standardResponse(res, 201, { success: true, message: "Tạo mã giảm giá thành công", data: coupon });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: "Lỗi khi tạo mã giảm giá", error: error.message });
  }
};

// Lấy tất cả mã giảm giá
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await discountCouponModel.find();
    return standardResponse(res, 200, { success: true, message: "Lấy danh sách mã giảm giá thành công", data: coupons });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: "Lỗi khi lấy danh sách mã giảm giá", error: error.message });
  }
};

// Lấy mã giảm giá theo id
const getCouponById = async (req, res) => {
  try {
    const coupon = await discountCouponModel.findById(req.params.id);
    if (!coupon) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy mã giảm giá" });
    }
    return standardResponse(res, 200, { success: true, message: "Lấy thông tin mã giảm giá thành công", data: coupon });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: "Lỗi khi lấy thông tin mã giảm giá", error: error.message });
  }
};

// Cập nhật mã giảm giá
const updateCoupon = async (req, res) => {
  try {
    const updatedCoupon = await discountCouponModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCoupon) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy mã giảm giá" });
    }
    return standardResponse(res, 200, { success: true, message: "Cập nhật mã giảm giá thành công", data: updatedCoupon });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: "Lỗi khi cập nhật mã giảm giá", error: error.message });
  }
};

// Xóa mã giảm giá
const deleteCoupon = async (req, res) => {
  try {
    const deletedCoupon = await discountCouponModel.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy mã giảm giá" });
    }
    return standardResponse(res, 200, { success: true, message: "Xóa mã giảm giá thành công", data: deletedCoupon });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: "Lỗi khi xóa mã giảm giá", error: error.message });
  }
};

// Áp dụng mã giảm giá cho đơn hàng
const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await discountCouponModel.findOne({ code });
    if (!coupon) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy mã giảm giá" });
    }
    if (!coupon.isActive) {
      return standardResponse(res, 400, { success: false, message: "Mã giảm giá không hợp lệ" });
    }
    if (coupon.expirationDate && new Date() > coupon.expirationDate) {
      return standardResponse(res, 400, { success: false, message: "Mã giảm giá đã hết hạn" });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return standardResponse(res, 400, { success: false, message: "Mã giảm giá đã hết lượt sử dụng" });
    }
    if (orderAmount < coupon.minimumOrderAmount) {
      return standardResponse(res, 400, { success: false, message: `Giá trị đơn hàng phải lớn hơn ${coupon.minimumOrderAmount}` });
    }
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = orderAmount * (coupon.discountValue / 100);
    } else if (coupon.discountType === "fixed_amount") {
      discountAmount = coupon.discountValue;
    }
    // Tăng số lần sử dụng mã giảm giá
    coupon.usedCount += 1;
    await coupon.save();
    return standardResponse(res, 200, { success: true, message: "Áp dụng mã giảm giá thành công", data: { discountAmount, coupon } });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: "Lỗi khi áp dụng mã giảm giá", error: error.message });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
};
