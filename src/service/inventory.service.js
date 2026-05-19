import productModel from "../models/product.model.js";
import orderModel from "../models/order.model.js";
import { standardResponse } from "../utils/utility.function.js";

class InventoryService {
  /**
   * Kiểm tra sản phẩm có sẵn sàng và còn hạn sử dụng không
   */
  static async checkProductAvailability(productId, quantity = 1) {
    try {
      const product = await productModel.findById(productId);
      
      if (!product) {
        return { 
          available: false, 
          reason: "Sản phẩm không tồn tại" 
        };
      }

      if (!product.isAvailable) {
        return { 
          available: false, 
          reason: "Sản phẩm hiện không có sẵn" 
        };
      }

      // Kiểm tra hạn sử dụng
      if (product.shelfLife && !product.isFresh) {
        return { 
          available: false, 
          reason: "Sản phẩm đã hết hạn sử dụng" 
        };
      }

      // Nếu có quản lý quantity trong tương lai
      if (product.quantity !== undefined && product.quantity < quantity) {
        return { 
          available: false, 
          reason: `Chỉ còn ${product.quantity} sản phẩm trong kho` 
        };
      }

      return { 
        available: true, 
        product 
      };
    } catch (error) {
      console.error("Error checking product availability:", error);
      return { 
        available: false, 
        reason: "Lỗi hệ thống" 
      };
    }
  }

  /**
   * Kiểm tra nhiều sản phẩm cùng lúc (cho giỏ hàng/đơn hàng)
   */
  static async checkMultipleProductsAvailability(items) {
    const results = [];
    let allAvailable = true;

    for (const item of items) {
      const check = await this.checkProductAvailability(
        item.product_id, 
        item.quantity
      );
      
      results.push({
        product_id: item.product_id,
        quantity: item.quantity,
        ...check
      });

      if (!check.available) {
        allAvailable = false;
      }
    }

    return {
      allAvailable,
      results
    };
  }

  /**
   * Cập nhật tồn kho sau khi đặt hàng
   */
  static async updateStockAfterOrder(orderId) {
    try {
      const order = await orderModel.findById(orderId).populate('items.product_id');
      
      if (!order) {
        throw new Error("Đơn hàng không tồn tại");
      }

      const updatePromises = order.items.map(async (item) => {
        const product = item.product_id;
        
        // Giảm số lượng tồn kho (nếu có field quantity)
        if (product.quantity !== undefined) {
          await productModel.findByIdAndUpdate(
            item.product_id._id,
            { $inc: { quantity: -item.quantity } }
          );
        }

        // Tăng số lần bán
        await productModel.findByIdAndUpdate(
          item.product_id._id,
          { $inc: { soldCount: item.quantity } }
        );

        return {
          product_id: item.product_id._id,
          quantity: item.quantity,
          name: product.name
        };
      });

      const updatedProducts = await Promise.all(updatePromises);

      return {
        success: true,
        updatedProducts,
        message: "Cập nhật tồn kho thành công"
      };
    } catch (error) {
      console.error("Error updating stock:", error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Hoàn lại tồn kho khi hủy đơn hàng
   */
  static async restoreStockOnOrderCancel(orderId) {
    try {
      const order = await orderModel.findById(orderId).populate('items.product_id');
      
      if (!order) {
        throw new Error("Đơn hàng không tồn tại");
      }

      // Chỉ hoàn lại tồn kho cho các đơn hàng chưa được giao
      if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
        return {
          success: false,
          message: "Không thể hoàn lại tồn kho cho đơn hàng này"
        };
      }

      const updatePromises = order.items.map(async (item) => {
        // Tăng lại số lượng tồn kho
        if (item.product_id.quantity !== undefined) {
          await productModel.findByIdAndUpdate(
            item.product_id._id,
            { $inc: { quantity: item.quantity } }
          );
        }

        // Giảm số lần bán
        await productModel.findByIdAndUpdate(
          item.product_id._id,
          { $inc: { soldCount: -item.quantity } }
        );

        return {
          product_id: item.product_id._id,
          quantity: item.quantity,
          name: item.product_id.name
        };
      });

      const restoredProducts = await Promise.all(updatePromises);

      return {
        success: true,
        restoredProducts,
        message: "Hoàn lại tồn kho thành công"
      };
    } catch (error) {
      console.error("Error restoring stock:", error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Lấy danh sách sản phẩm sắp hết hạn
   */
  static async getExpiringProducts(hoursThreshold = 24) {
    try {
      const thresholdTime = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);
      
      const expiringProducts = await productModel.find({
        shelfLife: { $exists: true, $gt: 0 },
        createdAt: { $lte: new Date(thresholdTime.getTime() - 24 * 60 * 60 * 1000) },
        isAvailable: true
      })
      .select('name shelfLife createdAt isFresh expiresAt')
      .lean();

      return expiringProducts.map(product => ({
        ...product,
        hoursUntilExpiry: Math.floor((product.expiresAt - new Date()) / (1000 * 60 * 60)),
        isExpiringSoon: product.expiresAt <= thresholdTime
      }));
    } catch (error) {
      console.error("Error getting expiring products:", error);
      return [];
    }
  }

  /**
   * Lấy thống kê tồn kho
   */
  static async getInventoryStats() {
    try {
      const stats = await productModel.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            availableProducts: {
              $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
            },
            featuredProducts: {
              $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
            },
            onSaleProducts: {
              $sum: { $cond: [{ $eq: ['$isOnSale', true] }, 1, 0] }
            },
            averagePrice: { $avg: '$price' },
            totalValue: { $sum: '$price' }
          }
        }
      ]);

      return stats[0] || {
        totalProducts: 0,
        availableProducts: 0,
        featuredProducts: 0,
        onSaleProducts: 0,
        averagePrice: 0,
        totalValue: 0
      };
    } catch (error) {
      console.error("Error getting inventory stats:", error);
      return null;
    }
  }
}

export default InventoryService;
