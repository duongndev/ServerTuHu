import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default:
        "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    fcmToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[0-9]{10,11}$/.test(v);
        },
        message: 'Số điện thoại không hợp lệ'
      }
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserSchema.pre("save", async function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual để kiểm tra account có bị lock không
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method để tăng login attempts
UserSchema.methods.incLoginAttempts = function() {
  // Nếu có lockUntil và đã hết hạn, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Nếu đạt max attempts và chưa bị lock, set lockUntil
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock 2 giờ
  }
  
  return this.updateOne(updates);
};

// Method để reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method để update last login
UserSchema.methods.updateLastLogin = function(ipAddress, userAgent) {
  return this.updateOne({
    $set: {
      lastLogin: new Date(),
      ipAddress: ipAddress,
      userAgent: userAgent
    }
  });
};

export default mongoose.model("User", UserSchema);
