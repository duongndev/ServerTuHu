import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          default: 0,
        },
        quantity: {
          type: Number,
          required: true,
          default: 0,
        },
        total: {
          type: Number,
          required: true,
          default: function () {
            return this.price * this.quantity;
          },
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    delivery_fee: {
      type: Number,
      required: true,
      default: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    coupon_code: {
      type: String,
      default: null,
    },
    total_price: {
      type: Number,
      required: true,
      default: function () {
        return this.subtotal + this.delivery_fee - (this.discount_amount || 0);
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "canceled",
      ],  
      default: "pending",
    },
    payment_method: {
      type: String,
      enum: ["cash", "momo", "zalopay", "vnpay"],
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    payment_date: {
      type: Date,
      default: null,
    },
    transaction_id: {
      type: String,
      default: null,
    },
    zp_trans_id: {
      type: String, // Mã giao dịch của ZaloPay (cần thiết cho Refund)
      default: null,
    },
    refund_id: {
      type: String, // Mã yêu cầu hoàn tiền (m_refund_id)
      default: null,
    },
    shipping_address: {
      receiver_name: { type: String, required: true },
      phone: { type: String, required: true },
      full_address: { type: String, required: true },
    },
    notes: {
      type: String,
      default: "",
    },
    cancel_reason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save middleware để tính toán lại các giá trị
OrderSchema.pre("save", function (next) {
  // Tính total cho từng item
  this.items.forEach((item) => {
    item.total = item.price * item.quantity;
  });

  // Tính subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

  // Tính totalPrice
  this.total_price =
    this.subtotal + this.delivery_fee - (this.discount_amount || 0);

  // Cập nhật thời gian
  this.updated_at = Date.now();

  next();
});

// Virtual field để lấy thông tin chi tiết về mã giảm giá
OrderSchema.virtual("couponInfo", {
  ref: "DiscountCoupon",
  localField: "coupon_code",
  foreignField: "code",
  justOne: true,
});

// Đảm bảo virtuals được bao gồm khi chuyển đổi sang JSON
OrderSchema.set("toJSON", { virtuals: true });
OrderSchema.set("toObject", { virtuals: true });

export default mongoose.model("Order", OrderSchema);
