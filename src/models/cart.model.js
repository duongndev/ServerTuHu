import mongoose from "mongoose";
const CartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    totalPrice: { type: Number, default: 0 },
    // guestSessionId: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


CartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Cart", CartSchema);
