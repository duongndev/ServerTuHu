import mongoose from 'mongoose';
const bannerSchema = new mongoose.Schema({
    imgUrls:[
        {
            type: String,
            required: true,
        }
    ],
}, {
    timestamps: true,
    versionKey: false
});

bannerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Banner', bannerSchema);
