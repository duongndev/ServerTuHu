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
import cacheService from "../service/cache.service.js";
import {
  parsePagination,
  buildProductFilters,
  buildSortOptions,
  buildSearchQuery,
  formatPaginationResponse,
  transformProducts,
  validateFilters
} from "../utils/productFilters.utils.js";

// Tạo sản phẩm mới
const createProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    price, 
    category_id, 
    ingredients, 
    allergens, 
    nutritionInfo, 
    weight, 
    size, 
    shelfLife, 
    storageCondition, 
    discountPrice, 
    tags, 
    slug 
  } = req.body;

  // Validate required fields
  if (!name || !description || !price || !category_id || !weight || !shelfLife) {
    return standardResponse(res, 400, { success: false, message: "Vui lòng nhập đầy đủ thông tin bắt buộc (tên, mô tả, giá, danh mục, trọng lượng, hạn sử dụng)" });
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

  // Parse arrays and objects
  const parsedIngredients = ingredients ? (Array.isArray(ingredients) ? ingredients : JSON.parse(ingredients)) : [];
  const parsedAllergens = allergens ? (Array.isArray(allergens) ? allergens : JSON.parse(allergens)) : [];
  const parsedNutritionInfo = nutritionInfo ? (typeof nutritionInfo === 'object' ? nutritionInfo : JSON.parse(nutritionInfo)) : {};
  const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

  const newProduct = new productModel({ 
    name, 
    description, 
    price, 
    category_id, 
    imgUrl, 
    ingredients: parsedIngredients,
    allergens: parsedAllergens,
    nutritionInfo: parsedNutritionInfo,
    weight,
    size: size || 'M',
    shelfLife,
    storageCondition: storageCondition || 'Nhiệt độ phòng',
    discountPrice,
    isFeatured, 
    isOnSale,
    tags: parsedTags,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  });
  
  await newProduct.save();

  // Clear relevant caches
  cacheService.clearAllProductCaches();

  await AuditLog.createLog({
    userId: req.user?.id,
    action: 'PRODUCT_CREATED',
    resource: 'Product',
    resourceId: newProduct._id,
    details: {
      productName: name,
      price: price,
      categoryId: category_id,
      weight,
      shelfLife,
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
  const { 
    name, 
    description, 
    price, 
    category_id, 
    ingredients, 
    allergens, 
    nutritionInfo, 
    weight, 
    size, 
    shelfLife, 
    storageCondition, 
    discountPrice, 
    tags, 
    slug 
  } = req.body;

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

  const isAvailable = req.body.isAvailable !== undefined 
    ? (req.body.isAvailable === 'true' || req.body.isAvailable === true) 
    : existingProduct.isAvailable;

  // Parse arrays and objects if provided
  const parsedIngredients = ingredients !== undefined 
    ? (Array.isArray(ingredients) ? ingredients : JSON.parse(ingredients || '[]')) 
    : existingProduct.ingredients;
  const parsedAllergens = allergens !== undefined 
    ? (Array.isArray(allergens) ? allergens : JSON.parse(allergens || '[]')) 
    : existingProduct.allergens;
  const parsedNutritionInfo = nutritionInfo !== undefined 
    ? (typeof nutritionInfo === 'object' ? nutritionInfo : JSON.parse(nutritionInfo || '{}')) 
    : existingProduct.nutritionInfo;
  const parsedTags = tags !== undefined 
    ? (Array.isArray(tags) ? tags : JSON.parse(tags || '[]')) 
    : existingProduct.tags;

  const updateData = {
    name: name !== undefined ? name : existingProduct.name,
    description: description !== undefined ? description : existingProduct.description,
    price: price !== undefined ? price : existingProduct.price,
    category_id: category_id !== undefined ? category_id : existingProduct.category_id,
    ingredients: parsedIngredients,
    allergens: parsedAllergens,
    nutritionInfo: parsedNutritionInfo,
    weight: weight !== undefined ? weight : existingProduct.weight,
    size: size !== undefined ? size : existingProduct.size,
    shelfLife: shelfLife !== undefined ? shelfLife : existingProduct.shelfLife,
    storageCondition: storageCondition !== undefined ? storageCondition : existingProduct.storageCondition,
    discountPrice: discountPrice !== undefined ? discountPrice : existingProduct.discountPrice,
    isOnSale,
    isFeatured,
    isAvailable,
    tags: parsedTags,
    slug: slug !== undefined ? slug : existingProduct.slug,
    imgUrl
  };

  const updatedProduct = await productModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );

  // Clear relevant caches
  cacheService.clearAllProductCaches();
  cacheService.clearProductCache(id);

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
      isOnSale,
      weight: weight !== undefined ? weight : existingProduct.weight
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

  // Clear relevant caches
  cacheService.clearAllProductCaches();
  cacheService.clearProductCache(id);

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

// Lấy danh sách sản phẩm (có phân trang và lọc)
const getAllProducts = asyncHandler(async (req, res) => {
  // Validate filters
  const filterErrors = validateFilters(req.query);
  if (filterErrors.length > 0) {
    return standardResponse(res, 400, { 
      success: false, 
      message: "Tham số lọc không hợp lệ", 
      data: { errors: filterErrors } 
    });
  }

  // Parse pagination
  const { page, limit, skip } = parsePagination(req.query);

  // Build filters and sort
  const filters = buildProductFilters(req.query);
  const sortOptions = buildSortOptions(req.query);

  // Apply search if provided
  const finalQuery = req.query.search 
    ? buildSearchQuery(req.query.search, filters)
    : filters;

  const [total, products] = await Promise.all([
    productModel.countDocuments(finalQuery),
    productModel.find(finalQuery)
      .select('name description price discountPrice imgUrl isOnSale averageRating totalReviews category_id weight size allergens tags createdAt')
      .populate('category_id', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const transformedProducts = transformProducts(products);

  return standardResponse(res, 200, {
    success: true,
    message: "Lấy danh sách sản phẩm thành công",
    data: transformedProducts,
    ...formatPaginationResponse(total, page, limit, {
      filters: Object.keys(req.query).filter(key => !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)),
      searchTerm: req.query.search
    })
  });
});

// Lấy sản phẩm theo id
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { relatedLimit = 4 } = req.query;
  relatedLimit = Math.max(1, parseInt(relatedLimit) || 4);

  // Try to get from cache first
  let product = await cacheService.getProductById(id);

  if (!product) {
    // If not in cache, get from database
    product = await productModel.findOne({ _id: id })
      .populate('category_id', 'name')
      .lean();

    if (!product) {
      return standardResponse(res, 404, { success: false, message: "Không tìm thấy sản phẩm" });
    }
  }

  const relatedProducts = await productModel
    .find({ 
      category_id: product.category_id?._id || product.category_id,
      _id: { $ne: id },
      isAvailable: true
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
    cached: !!product._cached
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

  // Parse pagination
  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

  // Build filters and sort
  const filters = buildProductFilters(req.query);
  const sortOptions = buildSortOptions({ sortBy, sortOrder });

  // Build search query
  const searchQuery = buildSearchQuery(searchTerm, filters);

  const [totalCount, products] = await Promise.all([
    productModel.countDocuments(searchQuery),
    productModel.find(searchQuery)
      .select('name description price discountPrice imgUrl isOnSale averageRating totalReviews category_id weight size allergens tags')
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

  const transformedProducts = transformProducts(products);

  return standardResponse(res, 200, {
    success: true,
    message: `Tìm thấy ${totalCount} sản phẩm phù hợp`,
    data: {
      products: transformedProducts,
      ...formatPaginationResponse(totalCount, pageNum, limitNum)
    },
    searchTerm
  });
});

// Lấy sản phẩm nổi bật
const getProductsFeatured = asyncHandler(async (req, res) => {
  let { limit = 10 } = req.query;
  limit = Math.max(1, parseInt(limit) || 10);

  // Try to get from cache first
  let products = await cacheService.getFeaturedProducts(limit);

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
    cached: true
  });
});

// Lấy sản phẩm đang giảm giá
const getProductsSale = asyncHandler(async (req, res) => {
  let { limit = 10 } = req.query;
  limit = Math.max(1, parseInt(limit) || 10);

  // Try to get from cache first
  let products = await cacheService.getSaleProducts(limit);

  const transformedProducts = products.map(p => ({
      ...p,
      category: p.category_id?.name || null,
      category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: "Lấy sản phẩm giảm giá thành công",
    data: transformedProducts,
    cached: true
  });
});

// Lấy sản phẩm mới (7 ngày gần nhất)
const getProductsNew = asyncHandler(async (req, res) => {
  let { limit = 10 } = req.query;
  limit = Math.max(1, parseInt(limit) || 10);

  // Try to get from cache first
  let products = await cacheService.getNewProducts(limit);
  
  const transformedProducts = products.map(p => ({
    ...p,
    category: p.category_id?.name || null,
    category_id: p.category_id?._id || p.category_id
  }));

  return standardResponse(res, 200, {
    success: true,
    message: products.length > 0 ? "Lấy sản phẩm mới thành công" : "Không có sản phẩm mới trong 7 ngày gần nhất",
    data: transformedProducts,
    cached: true
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
