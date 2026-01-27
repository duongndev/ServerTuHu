import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    ingredients: [
      {
        type: String,
        trim: true,
      },
    ],
    imgUrl:{
      type: String
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category_id: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isOnSale: 1 });
productSchema.index({ createdAt: -1 });

// Middleware cập nhật thời gian
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
export default mongoose.model("Product", productSchema);
