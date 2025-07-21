const mongoose = require("mongoose");

const DiscountCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Mã giảm giá duy nhất, ví dụ: "SUMMER2024"
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed_amount"],
      required: true,
      // Loại giảm giá: "percentage" (giảm theo phần trăm) hoặc "fixed_amount" (giảm số tiền cố định)
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      // Giá trị giảm giá. Nếu discountType là "percentage", đây là phần trăm (ví dụ: 10 cho 10%).
      // Nếu discountType là "fixed_amount", đây là số tiền giảm cố định (ví dụ: 50000 cho 50.000 VND).
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
      // Số tiền tối thiểu của đơn hàng để mã giảm giá này có thể được áp dụng.
    },
    usageLimit: {
      type: Number,
      default: null, // null means no limit
      min: 1,
      // Tổng số lần mã giảm giá này có thể được sử dụng trên tất cả các đơn hàng.
      // Nếu là null, không có giới hạn về số lần sử dụng.
    },
    usedCount: {
      type: Number,
      default: 0,
      // Số lần mã giảm giá này đã được sử dụng.
    },
    expirationDate: {
      type: Date,
      required: true,
      // Ngày hết hạn của mã giảm giá. Sau ngày này, mã sẽ không còn hiệu lực.
    },
    isActive: {
      type: Boolean,
      default: true,
      // Trạng thái hoạt động của mã giảm giá. True nếu đang hoạt động, False nếu đã bị vô hiệu hóa.
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("DiscountCoupon", DiscountCouponSchema);