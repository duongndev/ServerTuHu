import { standardResponse } from './utility.function.js';
// Helper: Kiểm tra tồn tại category
async function findCategoryOr404(categoryModel, category_id, res) {
  const category = await categoryModel.findOne({ _id: category_id });
  if (!category) {
    standardResponse(res, 404, { success: false, message: "Không tìm thấy thể loại" });
    return null;
  }
  return category;
}

// Helper: Kiểm tra tồn tại product
async function findProductOr404(productModel, id, res) {
  const product = await productModel.findById(id);
  if (!product) {
    standardResponse(res, 404, { success: false, message: "Không tìm thấy sản phẩm" });
    return null;
  }
  return product;
}

// Helper: Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export {
  findCategoryOr404,
  findProductOr404,
  validateEmail,
};
