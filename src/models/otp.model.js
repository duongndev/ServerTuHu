const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

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

otpSchema.plugin(AutoIncrement, { inc_field: "id", id: "otp_seq" });
otpSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
module.exports = mongoose.model("OTP", otpSchema);
