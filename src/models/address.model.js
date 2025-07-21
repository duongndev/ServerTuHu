const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverName: { type: String, required: true },
    province: {
      type: String,
    },
    ward: {
      type: String,
    },
    phone: { type: String, required: true },
    fullAddress: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Address", AddressSchema);
