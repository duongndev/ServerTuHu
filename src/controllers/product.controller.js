import asyncHandler from "express-async-handler";
import productModel from "../models/product.model.js";
import categoryModel from "../models/category.model.js";
import reviewModel from "../models/review.model.js";
import { standardResponse, logSecurityEvent } from "../utils/utility.function.js";
import {
  findCategoryOr404,
  findProductOr404,
} from "../utils/validate.function.js";
import { uploadImage, deleteImage } from "../service/upload.service.js"; // Import service
import AuditLog from "../models/auditLog.model.js";

// Tạo sản phẩm mới
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category_id } = req.body;

  // Validate required fields
  if (!name || !description || !price || !category_id) {
    return standardResponse(res, 400, { success: false, message: "Vui lòng nhập đầy đủ thông tin" });
  }

  // Validate category existence
  const category = await findCategoryOr404(categoryModel, category_id, res);
  if (!category) return; 

  // Check if product exists
  const existingProduct = await productModel.findOne({ name });
  if (existingProduct) {
    return standardResponse(res, 400, { success: false, message: "Sản phẩm này đã có trong danh sách" });
  }

  if (!req.file) {
    return standardResponse(res, 400, { success: false, message: "Vui lòng tải lên một hình ảnh" });
  }

  // Use upload service
  let imgUrl = "";
  try {
    imgUrl = await uploadImage(req.file.path, "TuHuBread/products");
  } catch (error) {
    return standardResponse(res, 500, { success: false, message: "Lỗi khi tải ảnh lên Cloudinary" });
  }

  const isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
  const isOnSale = req.body.isOnSale === 'true' || req.body.isOnSale === true;

  const newProduct = new productModel({ 
    name, 
    description, 
    price, 
    category_id, 
    imgUrl, 
    isFeatured, 
    isOnSale 
  });
  
  await newProduct.save();

  await AuditLog.createLog({
    userId: req.user?.id,
    action: 'PRODUCT_CREATED',
    resource: 'Product',
    resourceId: newProduct._id,
    details: {
      productName: name,
      price: price,
      categoryId: category_id,
      isFeatured,
      isOnSale
    },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    severity: 'LOW',
    status: 'SUCCESS',
    apiEndpoint: req.originalUrl,
    httpMethod: req.method
  });

  return standardResponse(res, 201, { 
    success: true, 
    message: "Thêm sản phẩm thành công", 
    data: newProduct 
  });
});

// Cập nhật sản phẩm
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, ingredients, discountPrice } = req.body;

  if (category_id) {
    const category = await findCategoryOr404(categoryModel, category_id, res);
    if (!category) return;
  }

  const existingProduct = await findProductOr404(productModel, id, res);
  if (!existingProduct) return;

  let imgUrl = existingProduct.imgUrl;
  if (req.file) {
    try {
      imgUrl = await uploadImage(req.file.path, "TuHuBread/products");
    } catch (error) {
      return standardResponse(res, 500, { success: false, message: "Lỗi khi tải ảnh lên Cloudinary" });
    }
  }

  const isFeatured = req.body.isFeatured !== undefined 
    ? (req.body.isFeatured === 'true' || req.body.isFeatured === true) 
    : existingProduct.isFeatured;
    
  const isOnSale = req.body.isOnSale !== undefined 
    ? (req.body.isOnSale === 'true' || req.body.isOnSale === true) 
    : existingProduct.isOnSale;

  const updatedProduct = await productModel.findByIdAndUpdate(
    id,
    { 
      name, 
      description, 
      price, 
      category_id, 
      ingredients, 
      isOnSale, 
      isFeatured, 
      discountPrice, 
      imgUrl 
    },
    { new: true }
  );

  await AuditLog.createLog({
    userId: req.user?.id,
    action: 'PRODUCT_UPDATED',
    resource: 'Product',
    resourceId: id,
    details: {
      productName: name || existingProduct.name,
      oldPrice: existingProduct.price,
      newPrice: price,
      categoryId: category_id,
      imageUpdated: !!req.file,
      isFeatured,
      isOnSale
    },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    severity: 'LOW',
    status: 'SUCCESS',
    apiEndpoint: req.originalUrl,
    httpMethod: req.method
  });

  return standardResponse(res, 200, { 
    success: true, 
    message: "Cập nhật sản phẩm thành công", 
    data: updatedProduct 
  });
});

// Xóa sản phẩm
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await findProductOr404(productModel, id, res);
  if (!product) return;

  // Use service to delete image
  if (product.imgUrl) {
    await deleteImage(product.imgUrl);
  }

  await productModel.findByIdAndDelete(id);

  await AuditLog.createLog({
    userId: req.user?.id,
    action: 'PRODUCT_DELETED',
    resource: 'Product',
    resourceId: id,
    details: {
      productName: product.name,
      price: product.price,
      categoryId: product.category_id,
      imageDeleted: !!product.imgUrl
    },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    severity: 'MEDIUM',
    status: 'SUCCESS',
    apiEndpoint: req.originalUrl,
    httpMethod: req.method
  });

  return standardResponse(res, 200, {
    success: true,
    message: "Xóa sản phẩm thành công",
    data: product,
  });
});

// LIST API (getAllProducts, getProductById, etc.) remain UNCHANGED as they don't upload/delete files.
// But we need to include them to keep the file complete.

// Lấy danh sách sản phẩm (có phân trang)
const getAllProducts = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100
  
  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    productModel.countDocuments(),
    productModel.find()
      .populate('category_id', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const transformedProducts = products.map(p => ({
    ...p,
    category: p.category_id?.name || null,
    category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: "Lấy danh sách sản phẩm thành công",
    data: transformedProducts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Lấy sản phẩm theo id
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { relatedLimit = 4 } = req.query;
  relatedLimit = Math.max(1, parseInt(relatedLimit) || 4);

  const product = await productModel.findOne({ _id: id })
    .populate('category_id', 'name')
    .lean();

  if (!product) {
    return standardResponse(res, 404, { success: false, message: "Không tìm thấy sản phẩm" });
  }

  const relatedProducts = await productModel
    .find({ 
      category_id: product.category_id?._id || product.category_id,
      _id: { $ne: id }
    })
    .select('_id name imgUrl price isOnSale isFeatured discountPrice totalReviews averageRating')
    .sort({ createdAt: -1 })
    .limit(relatedLimit)
    .lean();

  const data = {
    ...product,
    category: product.category_id?.name || null,
    category_id: product.category_id?._id || product.category_id,
    relatedProducts
  };

  return standardResponse(res, 200, {
    success: true,
    message: "Lấy sản phẩm thành công",
    data,
  });
});

// Lấy sản phẩm theo category id
const getProductByCategoryId = asyncHandler(async (req, res) => {
  const { id } = req.params; 
  let { page = 1, limit = 10 } = req.query;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 10));
  
  const category = await findCategoryOr404(categoryModel, id, res);
  if (!category) return;

  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    productModel.countDocuments({ category_id: id }),
    productModel.find({ category_id: id })
      .populate('category_id', 'name')
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const transformedProducts = products.map(p => ({
    ...p,
    category: p.category_id?.name || null,
    category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: "Lấy sản phẩm theo thể loại thành công",
    data: transformedProducts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Tìm kiếm sản phẩm theo tên
const searchProductByName = asyncHandler(async (req, res) => {
  const { name, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;
  
  if (!name || typeof name !== 'string') {
    return standardResponse(res, 400, { success: false, message: "Từ khóa tìm kiếm không hợp lệ" });
  }

  const searchTerm = name.trim();
  if (searchTerm.length < 2) {
    return standardResponse(res, 400, { success: false, message: "Từ khóa tìm kiếm phải có ít nhất 2 ký tự" });
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const searchQuery = {
    $and: [
      { isAvailable: true },
      { name: { $regex: searchTerm, $options: "i" } }
    ]
  };

  const sortOptions = {};
  const validSortFields = ['name', 'price', 'averageRating', 'createdAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
  sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

  const [totalCount, products] = await Promise.all([
    productModel.countDocuments(searchQuery),
    productModel.find(searchQuery)
      .select('name description price discountPrice imgUrl isOnSale averageRating totalReviews category_id')
      .populate('category_id', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean()
  ]);

  if (products.length === 0) {
    return standardResponse(res, 404, {
      success: false,
      message: "Không tìm thấy sản phẩm nào phù hợp",
      data: { products: [], pagination: { total: 0, page: pageNum, totalPages: 0, limit: limitNum } }
    });
  }

  const transformedProducts = products.map(p => ({
    ...p,
    category: p.category_id?.name || null,
    category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: `Tìm thấy ${totalCount} sản phẩm phù hợp`,
    data: {
      products: transformedProducts,
      pagination: {
        total: totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        limit: limitNum,
      },
      searchTerm
    }
  });
});

// Lấy sản phẩm nổi bật
const getProductsFeatured = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, parseInt(limit) || 10);
  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    productModel.countDocuments({ isFeatured: true }),
    productModel.find({ isFeatured: true })
      .populate('category_id', 'name')
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  if (!products.length) {
    return standardResponse(res, 404, { success: false, message: "Không tìm thấy sản phẩm nổi bật nào" });
  }

  const transformedProducts = products.map(p => ({
      ...p,
      category: p.category_id?.name || null,
      category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: "Lấy sản phẩm nổi bật thành công",
    data: transformedProducts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Lấy sản phẩm đang giảm giá
const getProductsSale = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, parseInt(limit) || 10);
  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    productModel.countDocuments({ isOnSale: true }),
    productModel.find({ isOnSale: true })
      .populate('category_id', 'name')
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const transformedProducts = products.map(p => ({
      ...p,
      category: p.category_id?.name || null,
      category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: "Lấy sản phẩm giảm giá thành công",
    data: transformedProducts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Lấy sản phẩm mới (7 ngày gần nhất)
const getProductsNew = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, parseInt(limit) || 10);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const newProductFilter = { createdAt: { $gte: sevenDaysAgo } };
  const skip = (page - 1) * limit;
  
  const [total, products] = await Promise.all([
    productModel.countDocuments(newProductFilter),
    productModel.find(newProductFilter)
      .populate('category_id', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);
  
  const transformedProducts = products.map(p => ({
    ...p,
    category: p.category_id?.name || null,
    category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: total > 0 ? "Lấy sản phẩm mới thành công" : "Không có sản phẩm mới trong 7 ngày gần nhất",
    data: transformedProducts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Cập nhật rating của sản phẩm dựa trên reviews
const updateProductRating = async (productId) => {
  try {
    const reviews = await reviewModel.find({ product_id: productId });
    const totalReviews = reviews.length;
    
    let averageRating = 0;
    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / totalReviews) * 10) / 10;
    }
    
    await productModel.findByIdAndUpdate(productId, {
      totalReviews,
      averageRating
    });
    
    return { totalReviews, averageRating };
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
};

// Lấy thống kê rating của sản phẩm
const getProductRatingStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await findProductOr404(productModel, id, res);
  if (!product) return;
  
  const reviews = await reviewModel.find({ product_id: id });
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[Math.floor(review.rating)]++;
    }
  });
  
  return standardResponse(res, 200, {
    success: true,
    message: "Lấy thống kê rating thành công",
    data: {
      totalReviews: product.totalReviews,
      averageRating: product.averageRating,
      ratingDistribution
    }
  });
});

export {
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
  updateProductRating,
  getProductRatingStats,
};
