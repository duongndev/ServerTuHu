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
    imgUrl: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function(v) {
          return !v || v < this.price;
        },
        message: 'Giá khuyến mãi phải nhỏ hơn giá gốc'
      }
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
    allergens: [
      {
        type: String, // gluten, lactose, nuts, eggs, etc.
        trim: true,
      },
    ],
    nutritionInfo: {
      calories: { type: Number, default: 0, min: 0 },
      protein: { type: Number, default: 0, min: 0 },
      fat: { type: Number, default: 0, min: 0 },
      carbs: { type: Number, default: 0, min: 0 },
      fiber: { type: Number, default: 0, min: 0 },
      sodium: { type: Number, default: 0, min: 0 },
    },
    weight: { // Trọng lượng (gram)
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      enum: ['S', 'M', 'L'],
      default: 'M',
    },
    shelfLife: { // Hạn sử dụng (giờ)
      type: Number,
      required: true,
      min: 1,
    },
    storageCondition: {
      type: String,
      default: 'Nhiệt độ phòng',
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
      min: 0,
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
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for search and filtering
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category_id: 1, isAvailable: 1 });
productSchema.index({ isFeatured: 1, isOnSale: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ price: 1 });
productSchema.index({ slug: 1 });

// Middleware cập nhật thời gian
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  
  // Validation cho discountPrice
  if (this.discountPrice && this.discountPrice >= this.price) {
    return next(new Error('Giá khuyến mãi phải nhỏ hơn giá gốc'));
  }
  
  // Validation cho shelfLife
  if (this.shelfLife && this.shelfLife < 1) {
    return next(new Error('Hạn sử dụng phải lớn hơn 0'));
  }
  
  // Validation cho weight
  if (this.weight && this.weight < 1) {
    return next(new Error('Trọng lượng phải lớn hơn 0'));
  }
  
  // Validation cho nutritionInfo
  if (this.nutritionInfo) {
    const nutritionFields = ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sodium'];
    for (const field of nutritionFields) {
      if (this.nutritionInfo[field] < 0) {
        return next(new Error(`${field} không thể là số âm`));
      }
    }
  }
  
  next();
});

// Static method để kiểm tra sản phẩm còn hạn sử dụng
productSchema.statics.isFresh = function(createdAt, shelfLifeHours) {
  const expiryTime = new Date(createdAt.getTime() + shelfLifeHours * 60 * 60 * 1000);
  return new Date() < expiryTime;
};

// Virtual field để kiểm tra sản phẩm còn tươi không
productSchema.virtual('isFresh').get(function() {
  if (!this.shelfLife) return true;
  return this.constructor.isFresh(this.createdAt, this.shelfLife);
});

// Virtual field để lấy thời gian hết hạn
productSchema.virtual('expiresAt').get(function() {
  if (!this.shelfLife) return null;
  const expiryTime = new Date(this.createdAt.getTime() + this.shelfLife * 60 * 60 * 1000);
  return expiryTime;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });
export default mongoose.model("Product", productSchema);
