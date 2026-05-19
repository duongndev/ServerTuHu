import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    imgUrl: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for search and filtering
categorySchema.index({ name: 'text' });
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ createdAt: -1 });

categorySchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Auto-generate slug from name if not provided
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    next();
});

export default mongoose.model('Category', categorySchema);
