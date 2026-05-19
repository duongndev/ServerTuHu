import productModel from "../models/product.model.js";
import { standardResponse } from "../utils/utility.function.js";
import InventoryService from "../service/inventory.service.js";

/**
 * Middleware kiểm tra hạn sử dụng sản phẩm khi thêm vào giỏ hàng
 */
const checkProductFreshness = async (req, res, next) => {
  try {
    // Chỉ kiểm tra cho các endpoint liên quan đến sản phẩm và đơn hàng
    const checkEndpoints = [
      '/api/carts',
      '/api/orders'
    ];
    
    const shouldCheck = checkEndpoints.some(endpoint => 
      req.originalUrl.includes(endpoint) && ['POST', 'PUT', 'PATCH'].includes(req.method)
    );

    if (!shouldCheck) {
      return next();
    }

    // Lấy danh sách sản phẩm từ request body
    let items = [];
    
    if (req.body.items && Array.isArray(req.body.items)) {
      items = req.body.items;
    } else if (req.body.product_id && req.body.quantity) {
      items = [req.body];
    }

    if (items.length === 0) {
      return next();
    }

    // Kiểm tra từng sản phẩm
    const availabilityCheck = await InventoryService.checkMultipleProductsAvailability(items);

    if (!availabilityCheck.allAvailable) {
      const unavailableItems = availabilityCheck.results.filter(item => !item.available);
      
      return standardResponse(res, 400, {
        success: false,
        message: "Một số sản phẩm không khả dụng:",
        data: {
          unavailableItems: unavailableItems.map(item => ({
            product_id: item.product_id,
            reason: item.reason
          }))
        }
      });
    }

    // Thêm thông tin sản phẩm tươi vào request để sử dụng sau này
    req.freshProducts = availabilityCheck.results.map(item => item.product);
    
    next();
  } catch (error) {
    console.error("Error in product freshness middleware:", error);
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi kiểm tra sản phẩm"
    });
  }
};

/**
 * Middleware tự động ẩn sản phẩm hết hạn
 */
const autoHideExpiredProducts = async (req, res, next) => {
  try {
    // Chạy định kỳ hoặc khi có request đến product list
    if (req.originalUrl.includes('/api/products') && req.method === 'GET') {
      
      // Tìm các sản phẩm đã hết hạn nhưng vẫn đang active
      const expiredProducts = await productModel.find({
        isAvailable: true,
        shelfLife: { $exists: true, $gt: 0 },
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Chỉ kiểm tra sản phẩm tạo > 24h
      });

      const productsToHide = [];
      
      for (const product of expiredProducts) {
        if (!product.isFresh) {
          productsToHide.push(product._id);
        }
      }

      // Ẩn các sản phẩm hết hạn
      if (productsToHide.length > 0) {
        await productModel.updateMany(
          { _id: { $in: productsToHide } },
          { isAvailable: false }
        );
        
        console.log(`Auto-hidden ${productsToHide.length} expired products`);
      }
    }
    
    next();
  } catch (error) {
    console.error("Error in auto-hide expired products middleware:", error);
    next(); // Vẫn cho tiếp tục để không ảnh hưởng user experience
  }
};

/**
 * Middleware kiểm tra và cảnh báo sản phẩm sắp hết hạn
 */
const warnExpiringProducts = async (req, res, next) => {
  try {
    // Chỉ chạy cho admin endpoints
    if (!req.originalUrl.includes('/api/admin') && !req.user?.role === 'admin') {
      return next();
    }

    const expiringSoon = await InventoryService.getExpiringProducts(24); // 24h tới

    if (expiringSoon.length > 0) {
      // Thêm warning vào response headers
      res.setHeader('X-Expiring-Products-Count', expiringSoon.length);
      res.setHeader('X-Expiring-Products', JSON.stringify(
        expiringSoon.map(p => ({ id: p._id, name: p.name, hoursLeft: p.hoursUntilExpiry }))
      ));
    }

    next();
  } catch (error) {
    console.error("Error in expiring products warning middleware:", error);
    next();
  }
};

/**
 * Middleware kiểm tra số lượng tồn kho (khi có field quantity)
 */
const checkStockAvailability = async (req, res, next) => {
  try {
    // Chỉ kiểm tra cho order creation
    if (!req.originalUrl.includes('/api/orders') || req.method !== 'POST') {
      return next();
    }

    const items = req.body.items || [];
    let stockIssues = [];

    for (const item of items) {
      const product = await productModel.findById(item.product_id);
      
      if (product && product.quantity !== undefined) {
        if (product.quantity < item.quantity) {
          stockIssues.push({
            product_id: item.product_id,
            productName: product.name,
            requested: item.quantity,
            available: product.quantity
          });
        }
      }
    }

    if (stockIssues.length > 0) {
      return standardResponse(res, 400, {
        success: false,
        message: "Một số sản phẩm không đủ số lượng trong kho:",
        data: { stockIssues }
      });
    }

    next();
  } catch (error) {
    console.error("Error in stock availability middleware:", error);
    next();
  }
};

export {
  checkProductFreshness,
  autoHideExpiredProducts,
  warnExpiringProducts,
  checkStockAvailability
};
