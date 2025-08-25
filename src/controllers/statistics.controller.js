import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import productModel from "../models/product.model.js";
import reviewModel from "../models/review.model.js";
import { standardResponse } from "../utils/utility.function.js";

/**
 * Thống kê tổng quan
 */
const getOverviewStatistics = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments({ role: "user" });
    const totalProducts = await productModel.countDocuments();
    const totalOrders = await orderModel.countDocuments();
    const totalRevenue = await orderModel.aggregate([
      { $match: { order_status: "delivered", payment_status: "paid" } },
      { $group: { _id: null, total: { $sum: "$total_price" } } }
    ]);

    const pendingOrders = await orderModel.countDocuments({ order_status: "pending" });
    const processingOrders = await orderModel.countDocuments({ order_status: "processing" });
    const shippedOrders = await orderModel.countDocuments({ order_status: "shipped" });
    const deliveredOrders = await orderModel.countDocuments({ order_status: "delivered" });
    const cancelledOrders = await orderModel.countDocuments({ order_status: "cancelled" });

    // Thống kê người dùng mới trong tháng
    const newUsersThisMonth = await userModel.countDocuments({
      role: "user",
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thống kê tổng quan thành công",
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        newUsersThisMonth,
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        }
      }
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy thống kê tổng quan",
      error: error.message
    });
  }
};

/**
 * Thống kê doanh thu theo thời gian
 */
const getRevenueStatistics = async (req, res) => {
  try {
    const { period = "month", year, month } = req.query;
    let matchCondition = {
      order_status: "delivered",
      payment_status: "paid"
    };

    // Thêm điều kiện thời gian nếu có
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      matchCondition.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      matchCondition.createdAt = { $gte: startDate, $lte: endDate };
    }

    let groupBy;
    if (period === "day") {
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      };
    } else if (period === "month") {
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
    } else {
      groupBy = {
        year: { $year: "$createdAt" }
      };
    }

    const revenueData = await orderModel.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: "$total_price" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total_price" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thống kê doanh thu thành công",
      data: revenueData
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy thống kê doanh thu",
      error: error.message
    });
  }
};

/**
 * Thống kê sản phẩm bán chạy
 */
const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await orderModel.aggregate([
      { $match: { order_status: "delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          productName: "$product.name",
          productImage: "$product.imgUrl",
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thống kê sản phẩm bán chạy thành công",
      data: topProducts
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy thống kê sản phẩm bán chạy",
      error: error.message
    });
  }
};

/**
 * Thống kê khách hàng
 */
const getCustomerStatistics = async (req, res) => {
  try {
    const totalCustomers = await userModel.countDocuments({ role: "user" });
    const newCustomersThisMonth = await userModel.countDocuments({
      role: "user",
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    // Top khách hàng theo số đơn hàng
    const topCustomersByOrders = await orderModel.aggregate([
      { $match: { order_status: "delivered" } },
      {
        $group: {
          _id: "$user_id",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total_price" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          userName: "$user.fullName",
          userEmail: "$user.email",
          totalOrders: 1,
          totalSpent: 1
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 }
    ]);

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thống kê khách hàng thành công",
      data: {
        totalCustomers,
        newCustomersThisMonth,
        topCustomersByOrders
      }
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy thống kê khách hàng",
      error: error.message
    });
  }
};

/**
 * Thống kê theo danh mục sản phẩm
 */
const getCategoryStatistics = async (req, res) => {
  try {
    const categoryStats = await orderModel.aggregate([
      { $match: { order_status: "delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category._id",
          categoryName: { $first: "$category.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thống kê theo danh mục thành công",
      data: categoryStats
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy thống kê theo danh mục",
      error: error.message
    });
  }
};

export {
  getOverviewStatistics,
  getRevenueStatistics,
  getTopSellingProducts,
  getCustomerStatistics,
  getCategoryStatistics
};