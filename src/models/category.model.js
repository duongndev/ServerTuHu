import mongoose from "mongoose";    
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
    }
}, {
    timestamps: true,
    versionKey: false
});

categorySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Category', categorySchema);
