const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Schema cho đánh giá sản phẩm
const ReviewSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.Number, required: true },
    rating: { type: Number, min: 0, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

ReviewSchema.pre("save", function (next) {
  if (this.rating < 0 || this.rating > 5) {
    throw new Error("Rating must be between 0 and 5");
  }
  next();
});

ReviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

ReviewSchema.plugin(AutoIncrement, { inc_field: "id", id: "review_seq" });

module.exports = mongoose.model("Reviews", ReviewSchema);
