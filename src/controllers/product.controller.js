const productModel = require("../models/product.model");
const categoryModel = require("../models/category.model");
const { standardResponse } = require("../utils/utility.function");
const {
  findCategoryOr404,
  findProductOr404,
} = require("../utils/validate.function");
const cloudinary = require("../config/cloudinary.config");
const fs = require("fs/promises");

// Tạo sản phẩm mới
const createProduct = async (req, res) => {
  const { name, description, price, category_id } = req.body;
  // Validate required fields
  if (!name || !description || !price || !category_id) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Vui lòng tải lên một hình ảnh" });
  }
  try {
    // Kiểm tra thể loại
    const category = await findCategoryOr404(categoryModel, category_id, res);
    if (!category) return;
    // Kiểm tra tên sản phẩm đã tồn tại
    const existingProduct = await productModel.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: "Sản phẩm này đã có trong danh sách" });
    }
    // Upload ảnh lên Cloudinary
    let imgUrl = "";
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "TuHuBread/products",
        use_filename: true,
        unique_filename: true,
      });
      imgUrl = result.secure_url;
      await fs.unlink(req.file.path);
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return res.status(500).json({ success: false, message: "Lỗi khi tải ảnh lên Cloudinary" });
    }
    // Ép kiểu boolean cho isFeatured, isOnSale nếu có
    const isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured === 'true' : false;
    const isOnSale = req.body.isOnSale !== undefined ? req.body.isOnSale === 'true' : false;
    // Tạo sản phẩm mới
    const newProduct = new productModel({ name, description, price, category_id, imgUrl, isFeatured, isOnSale });
    await newProduct.save();
    return res.status(201).json({ success: true, message: "Thêm sản phẩm thành công", data: newProduct });
  } catch (error) {
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, ingredients, isOnSale, isFeatured, discountPrice } = req.body;
  try {
    // Kiểm tra thể loại
    const category = await findCategoryOr404(categoryModel, category_id, res);
    if (!category) return;
    // Kiểm tra sản phẩm
    const existingProduct = await findProductOr404(productModel, id, res);
    if (!existingProduct) return;
    // Xử lý upload ảnh nếu có
    let imgUrl = existingProduct.imgUrl;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "TuHuBread/products",
          use_filename: true,
          unique_filename: true,
        });
        imgUrl = result.secure_url;
        await fs.unlink(req.file.path);
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi tải ảnh lên Cloudinary" });
      }
    }
    // Ép kiểu boolean cho isFeatured, isOnSale nếu có
    const isFeaturedBool = req.body.isFeatured !== undefined ? req.body.isFeatured === 'true' : existingProduct.isFeatured;
    const isOnSaleBool = req.body.isOnSale !== undefined ? req.body.isOnSale === 'true' : existingProduct.isOnSale;
    // Cập nhật sản phẩm
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      { name, description, price, category_id, ingredients, isOnSale: isOnSaleBool, isFeatured: isFeaturedBool, discountPrice, imgUrl },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Cập nhật sản phẩm thành công", data: updatedProduct });
  } catch (error) {
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Kiểm tra sản phẩm
    const product = await findProductOr404(productModel, id, res);
    if (!product) return;
    // Xóa ảnh trên Cloudinary nếu có
    if (product.imgUrl) {
      try {
        const publicId = product.imgUrl.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.uploader.destroy(`TuHuBread/products/${publicId}`);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }
    // Xóa sản phẩm
    await productModel.findByIdAndDelete(id);
    return standardResponse(res, 200, {
      success: true,
      message: "Xóa sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy danh sách sản phẩm (có phân trang)
const getAllProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    const skip = (page - 1) * limit;
    const total = await productModel.countDocuments();
    const products = await productModel.find().skip(skip).limit(limit);
    // Lấy tên thể loại cho từng sản phẩm
    const data = await Promise.all(
      products.map(async (product) => {
        const category = await categoryModel.findOne({
          _id: product.category_id,
        });
        return { ...product._doc, category: category ? category.name : null };
      })
    );
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy sản phẩm theo id
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productModel.findOne({ _id: id });
    if (!product)
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy sản phẩm theo category id
const getProductByCategoryId = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await findCategoryOr404(categoryModel, id, res);
    if (!category) return;
    const products = await productModel.find({ category_id: id });
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy sản phẩm theo thể loại thành công",
      data: products,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Tìm kiếm sản phẩm theo tên
const searchProductByName = async (req, res) => {
  const { name } = req.query;
  try {
    const products = await productModel.find({
      name: { $regex: new RegExp(name), $options: "i" },
    });
    if (!products || products.length === 0)
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    return standardResponse(res, 200, {
      success: true,
      message: "Tìm kiếm sản phẩm thành công",
      data: products,
    });
  } catch (error) {
    console.error("[searchProductByName]", error, error.stack);
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy sản phẩm nổi bật
const getProductsFeatured = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;
    const total = await productModel.countDocuments({ isFeatured: true });
    const products = await productModel
      .find({ isFeatured: true })
      .skip(skip)
      .limit(limit);
    if (!products) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy sản phẩm nổi bật nào",
      });
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy sản phẩm nổi bật thành công",
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy sản phẩm đang giảm giá
const getProductsSale = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;
    const total = await productModel.countDocuments({ isOnSale: true });
    const products = await productModel
      .find({ isOnSale: true })
      .skip(skip)
      .limit(limit);
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy sản phẩm giảm giá thành công",
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[getProductsSale]", error, error.stack);
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy sản phẩm mới (7 ngày gần nhất)
const getProductsNew = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;
    const total = await productModel.countDocuments();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const products = await productModel
      .find({ createdAt: { $gte: sevenDaysAgo } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy sản phẩm mới thành công",
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[getProductsNew]", error, error.stack);
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductByCategoryId,
  searchProductByName,
  getProductsFeatured,
  getProductsSale,
  getProductsNew,
};
