const categoryModel = require("../models/category.model");
const { standardResponse } = require("../utils/utility.function");

// Tạo mới category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return standardResponse(res, 400, { success: false, message: "Thiếu trường bắt buộc" });
    }
    const category = await categoryModel.findOne({ name });
    if (category) {
      return standardResponse(res, 400, { success: false, message: "Thể loại đã tồn tại" });
    }
    const newCategory = new categoryModel({ name, description });
    await newCategory.save();
    return standardResponse(res, 201, { success: true, message: "Tạo thể lại mới thành công", data: newCategory });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Cập nhật category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await categoryModel.findById(id);
    if (!category) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy thể loại" });
    }
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    return standardResponse(res, 200, { success: true, message: "Cập nhật thể loại thành công", data: updatedCategory });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Xóa category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findOneAndDelete({ _id: id });
    if (!category) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy thể loại" });
    }
    return standardResponse(res, 200, { success: true, message: "Xóa thể loại thành công", data: category });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Lấy tất cả category
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find();
    return standardResponse(res, 200, { success: true, message: "Lấy danh sách thể loại thành công", data: categories });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

// Lấy category theo id
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findById(id);
    if (!category) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy thể loại" });
    }
    return standardResponse(res, 200, { success: true, message: "Lấy thể loại thành công", data: category });
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: error.message });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
};
