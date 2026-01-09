import mongoose from "mongoose";

const BlacklistedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      default: "Logout",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index: tự động xóa document khi thời gian hiện tại > expiresAt
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("BlacklistedToken", BlacklistedTokenSchema);
