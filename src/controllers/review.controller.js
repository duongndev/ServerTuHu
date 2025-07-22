import reviewsModel from '../models/review.model.js';
import productModel from '../models/product.model.js';
import userModel from '../models/user.model.js';
import { standardResponse } from '../utils/utility.function.js';

// Tạo review mới cho sản phẩm
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const product = await productModel.findById(productId);
    if (!product) {
      return standardResponse(res, 404, { success: false, message: 'Không tìm thấy sản phẩm' });
    }
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return standardResponse(res, 404, { success: false, message: 'Không tìm thấy người dùng' });
    }
    // Chỉ cho phép 1 user review 1 sản phẩm 1 lần
    const existed = await reviewsModel.findOne({ user_id: req.user._id, productId });
    if (existed) {
      return standardResponse(res, 400, { success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }
    const review = new reviewsModel({ user_id: req.user._id, rating, comment });
    await review.save();
    return standardResponse(res, 201, { success: true, message: 'Tạo đánh giá thành công', data: review });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Lấy tất cả review của 1 sản phẩm
const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewsModel.find({ productId });
    return standardResponse(res, 200, { success: true, message: 'Lấy đánh giá theo sản phẩm thành công', data: reviews });
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
    if (review.user_id !== req.user._id) {
      return standardResponse(res, 403, { success: false, message: 'Không có quyền sửa đánh giá này' });
    }
    review.rating = rating;
    review.comment = comment;
    await review.save();
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
    if (review.user_id !== req.user._id) {
      return standardResponse(res, 403, { success: false, message: 'Không có quyền xóa đánh giá này' });
    }
    await reviewsModel.findByIdAndDelete(id);
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

