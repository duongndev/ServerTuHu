import mongoose from "mongoose";
const otpSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.ObjectId, ref: "User" },
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }, // Thời gian hết hạn
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

otpSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
export default mongoose.model("OTP", otpSchema);
