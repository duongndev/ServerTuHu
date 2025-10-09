import productModel from "../models/product.model.js";
import categoryModel from "../models/category.model.js";
import reviewModel from "../models/review.model.js";
import { standardResponse, logSecurityEvent } from "../utils/utility.function.js";
import {
  findCategoryOr404,
  findProductOr404,
} from "../utils/validate.function.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";
import AuditLog from "../models/auditLog.model.js";

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

    // Log audit event
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

    return res.status(201).json({ success: true, message: "Thêm sản phẩm thành công", data: newProduct });
  } catch (error) {
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
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

    // Log audit event
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
        isFeatured: isFeaturedBool,
        isOnSale: isOnSaleBool
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      severity: 'LOW',
      status: 'SUCCESS',
      apiEndpoint: req.originalUrl,
      httpMethod: req.method
    });

    return res.status(200).json({ success: true, message: "Cập nhật sản phẩm thành công", data: updatedProduct });
  } catch (error) {
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
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

    // Log audit event
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
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

// Lấy danh sách sản phẩm (có phân trang)
const getAllProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    limit = parseInt(limit);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Giới hạn tối đa 100 bản ghi
    const skip = (page - 1) * limit;
    const total = await productModel.countDocuments();
    const products = await productModel.find().skip(skip).limit(limit);
    // Lấy tên thể loại cho từng sản phẩm
    // const data = await Promise.all(
    //   products.map(async (product) => {
    //     const category = await categoryModel.findOne({
    //       _id: product.category_id,
    //     });
    //     return { ...product._doc, category: category ? category.name : null };
    //   })
    // );
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
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
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

// Lấy sản phẩm theo id
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    let { relatedLimit = 4 } = req.query;
    relatedLimit = parseInt(relatedLimit);
    if (isNaN(relatedLimit) || relatedLimit < 1) relatedLimit = 6;
    
    const product = await productModel.findOne({ _id: id }).lean();
    if (!product)
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    
    // Lấy thông tin category
    const category = await categoryModel.findById(product.category_id).lean();
    
    // Lấy sản phẩm cùng thể loại (loại trừ sản phẩm hiện tại)
    const relatedProducts = await productModel
      .find({ 
        category_id: product.category_id,
        _id: { $ne: id }
      })
      .select('_id name imgUrl price isOnSale isFeatured discountPrice totalReviews averageRating')
      .sort({ createdAt: -1 })
      .limit(relatedLimit)
      .lean();
    
    // Chỉ trả về các trường cần thiết cho sản phẩm liên quan
    const relatedProductsSimplified = relatedProducts.map(relatedProduct => ({
      _id: relatedProduct._id,
      name: relatedProduct.name,
      imgUrl: relatedProduct.imgUrl,
      price: relatedProduct.price,
      isOnSale: relatedProduct.isOnSale,
      isFeatured: relatedProduct.isFeatured,
      discountPrice: relatedProduct.discountPrice,
      totalReviews: relatedProduct.totalReviews,
      averageRating: relatedProduct.averageRating
    }));
    
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy sản phẩm thành công",
      data: {
        ...product,
        category: category ? category.name : null,
        relatedProducts: relatedProductsSimplified
      },
    });
  } catch (error) {
    console.error("[getProductById]", error, error.stack);
    return standardResponse(res, 500, {
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

// Lấy sản phẩm theo category id
const getProductByCategoryId = async (req, res) => {
  try {
    const { id } = req.params; 
    const { page = 1, limit = 10 } = req.query;
    const category = await findCategoryOr404(categoryModel, id, res);
    if (!category) return;
    const products = await productModel.find({ category_id: id })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await productModel.countDocuments({ category_id: id });
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy sản phẩm theo thể loại thành công",
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
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

// Tìm kiếm sản phẩm theo tên
const searchProductByName = async (req, res) => {
  const { name, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;
  
  try {
    // Validation và sanitization
    if (!name || typeof name !== 'string') {
      return standardResponse(res, 400, {
        success: false,
        message: "Từ khóa tìm kiếm không hợp lệ",
      });
    }

    const searchTerm = name.trim();
    if (searchTerm.length < 2) {
      return standardResponse(res, 400, {
        success: false,
        message: "Từ khóa tìm kiếm phải có ít nhất 2 ký tự",
      });
    }

    // Tạo query tìm kiếm tối ưu
    const searchQuery = {
      $and: [
        { isAvailable: true }, // Chỉ tìm sản phẩm có sẵn
        {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
          ]
        }
      ]
    };

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Giới hạn tối đa 50 items
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    const validSortFields = ['name', 'price', 'averageRating', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortField] = sortDirection;

    // Thực hiện tìm kiếm với projection để tối ưu performance
    const [products, totalCount] = await Promise.all([
      productModel
        .find(searchQuery)
        .select('name description price discountPrice imgUrl isOnSale averageRating totalReviews category_id')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(), // Sử dụng lean() để tăng performance
      productModel.countDocuments(searchQuery)
    ]);

    if (!products || products.length === 0) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy sản phẩm nào phù hợp",
        data: {
          products: [],
          pagination: {
            total: totalCount,
            page: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            limit: limitNum,
          }
        }
      });
    }

    // Tính toán pagination info
    const totalPages = Math.ceil(totalCount / limitNum);

    return standardResponse(res, 200, {
      success: true,
      message: `Tìm thấy ${totalCount} sản phẩm phù hợp`,
      data: {
        products,
        pagination: {
          total: totalCount,
          page: pageNum,
          totalPages,
          limit: limitNum,
        },
        searchTerm: searchTerm
      }
    });

  } catch (error) {
    console.error("[searchProductByName]", error, error.stack);
    return standardResponse(res, 500, {
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
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
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
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
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

// Lấy sản phẩm mới (7 ngày gần nhất)
const getProductsNew = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    
    // Validate pagination parameters
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    
    // Tính toán ngày 7 ngày trước
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Tạo filter condition cho sản phẩm mới
    const newProductFilter = { createdAt: { $gte: sevenDaysAgo } };
    
    const skip = (page - 1) * limit;
    
    // Đếm tổng số sản phẩm mới (chỉ sản phẩm trong 7 ngày)
    const total = await productModel.countDocuments(newProductFilter);
    
    // Lấy sản phẩm mới với phân trang
    const products = await productModel
      .find(newProductFilter)
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .skip(skip)
      .limit(limit)
      .lean(); // Sử dụng lean() để tối ưu hiệu suất
    
    // Thêm thông tin category cho từng sản phẩm
    const productsWithCategory = await Promise.all(
      products.map(async (product) => {
        const category = await categoryModel.findById(product.category_id).lean();
        return {
          ...product,
          category: category ? category.name : null
        };
      })
    );
    
    return standardResponse(res, 200, {
      success: true,
      message: total > 0 ? "Lấy sản phẩm mới thành công" : "Không có sản phẩm mới trong 7 ngày gần nhất",
      data: productsWithCategory,
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
      message: "Lỗi server khi lấy sản phẩm mới",
    });
  }
};



// Cập nhật rating của sản phẩm dựa trên reviews
const updateProductRating = async (productId) => {
  try {
    const reviews = await reviewModel.find({ product_id: productId });
    const totalReviews = reviews.length;
    
    let averageRating = 0;
    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / totalReviews) * 10) / 10; // Làm tròn 1 chữ số thập phân
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
const getProductRatingStats = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await findProductOr404(productModel, id, res);
    if (!product) return;
    
    const reviews = await reviewModel.find({ product_id: id });
    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
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
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau."
    });
  }
};

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
