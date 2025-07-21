const mongoose = require("mongoose");

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
    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: function () {
        return this.subtotal + this.deliveryFee - (this.discountAmount || 0);
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
    paymentMethod: {
      type: String,
      enum: ["cash", "momo", "zalopay", "vnpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    shippingAddress: {
      receiverName: { type: String, required: true },
      phone: { type: String, required: true },
      fullAddress: { type: String, required: true },
    },
    notes: {
      type: String,
      default: "",
    },
    cancelReason: {
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
  this.totalPrice =
    this.subtotal + this.deliveryFee - (this.discountAmount || 0);

  // Cập nhật thời gian
  this.updatedAt = Date.now();

  next();
});

// Virtual field để lấy thông tin chi tiết về mã giảm giá
OrderSchema.virtual("couponInfo", {
  ref: "DiscountCoupon",
  localField: "couponCode",
  foreignField: "code",
  justOne: true,
});

// Đảm bảo virtuals được bao gồm khi chuyển đổi sang JSON
OrderSchema.set("toJSON", { virtuals: true });
OrderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Order", OrderSchema);
