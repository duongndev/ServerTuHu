import reviewsModel from '../models/review.model.js';
import productModel from '../models/product.model.js';
import userModel from '../models/user.model.js';
import { standardResponse } from '../utils/utility.function.js';
import { updateProductRating } from './product.controller.js';

// Tạo review mới cho sản phẩm
const createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const product = await productModel.findById(product_id);
    if (!product) {
      return standardResponse(res, 404, { success: false, message: 'Không tìm thấy sản phẩm' });
    }
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return standardResponse(res, 404, { success: false, message: 'Không tìm thấy người dùng' });
    }
    // Chỉ cho phép 1 user review 1 sản phẩm 1 lần
    const existed = await reviewsModel.findOne({ user_id: req.user._id, product_id });
    if (existed) {
      return standardResponse(res, 400, { success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }
    const review = new reviewsModel({ user_id: req.user._id, product_id, rating, comment });
    await review.save();
    
    // Cập nhật rating của sản phẩm
    await updateProductRating(product_id);
    
    return standardResponse(res, 201, { success: true, message: 'Tạo đánh giá thành công', data: review });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Lấy tất cả review của 1 sản phẩm
const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    
    const skip = (page - 1) * limit;
    const total = await reviewsModel.countDocuments({ product_id: productId });
    
    const reviews = await reviewsModel
      .find({ product_id: productId })
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    return standardResponse(res, 200, { 
      success: true, 
      message: 'Lấy đánh giá theo sản phẩm thành công', 
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Lấy tất cả review của 1 user
const getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await reviewsModel.find({ user_id: userId });
    return standardResponse(res, 200, { success: true, message: 'Lấy đánh giá theo user thành công', data: reviews });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Cập nhật review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const review = await reviewsModel.findById(id);
    if (!review) {
      return standardResponse(res, 404, { success: false, message: 'Không tìm thấy đánh giá' });
    }
    if (review.user_id.toString() !== req.user._id.toString()) {
      return standardResponse(res, 403, { success: false, message: 'Không có quyền sửa đánh giá này' });
    }
    
    const productId = review.product_id;
    review.rating = rating;
    review.comment = comment;
    await review.save();
    
    // Cập nhật rating của sản phẩm
    await updateProductRating(productId);
    
    return standardResponse(res, 200, { success: true, message: 'Cập nhật đánh giá thành công', data: review });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Xóa review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await reviewsModel.findById(id);
    if (!review) {
      return standardResponse(res, 404, { success: false, message: 'Không tìm thấy đánh giá' });
    }
    if (review.user_id.toString() !== req.user._id.toString()) {
      return standardResponse(res, 403, { success: false, message: 'Không có quyền xóa đánh giá này' });
    }
    
    const productId = review.product_id;
    await reviewsModel.findByIdAndDelete(id);
    
    // Cập nhật rating của sản phẩm
    await updateProductRating(productId);
    
    return standardResponse(res, 200, { success: true, message: 'Xóa đánh giá thành công' });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

export {
  createReview,
  getReviewsByProduct,
  getReviewsByUser,
  updateReview,
  deleteReview,
};

