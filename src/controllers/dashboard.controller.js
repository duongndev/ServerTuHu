import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Category from "../models/category.model.js";
import Review from "../models/review.model.js";
import DiscountCoupon from "../models/discountCoupon.model.js";
import {
  successResponse,
  internalServerErrorResponse
} from "../middlewares/middleware.js";

// Lấy thống kê tổng quan
const getOverviewStats = async (req, res) => {
  try {
    // Chuẩn bị thời gian cho thống kê hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Chạy các query song song để tối ưu hiệu suất
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalReviews,
      totalCoupons,
      orderStats,
      totalRevenueResult,
      todayOrders,
      todayRevenueResult,
      newUsersToday
    ] = await Promise.all([
      // Tổng số lượng
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Category.countDocuments(),
      Review.countDocuments(),
      DiscountCoupon.countDocuments(),
      
      // Thống kê đơn hàng theo trạng thái
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Tổng doanh thu (chỉ tính đơn đã giao)
      Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Đơn hàng hôm nay
      Order.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      }),

      // Doanh thu hôm nay
      Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Người dùng mới hôm nay
      User.countDocuments({
        role: "user",
        createdAt: { $gte: today, $lt: tomorrow },
      })
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalReviews,
        totalCoupons,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        todayOrders,
        todayRevenue: todayRevenueResult[0]?.total || 0,
        newUsersToday,
      },
      ordersByStatus: orderStats,
    };

    return successResponse(res, "Lấy thống kê tổng quan thành công", stats);
  } catch (error) {
    console.error("Error in getOverviewStats:", error);
    return internalServerErrorResponse(res, "Lỗi server khi lấy thống kê tổng quan");
  }
};

// Thống kê doanh thu theo thời gian
const getRevenueStats = async (req, res) => {
  try {
    const { period = "month", year, month } = req.query;
    let matchCondition = { status: "delivered" };
    let groupBy = {};

    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(year) : currentYear;

    if (period === "year") {
      // Thống kê theo năm (từng tháng trong năm)
      matchCondition.createdAt = {
        $gte: new Date(`${targetYear}-01-01`),
        $lt: new Date(`${targetYear + 1}-01-01`),
      };
      groupBy = {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 },
      };
    } else if (period === "month") {
      // Thống kê theo tháng (từng ngày trong tháng)
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 1);

      matchCondition.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
      groupBy = {
        _id: { $dayOfMonth: "$createdAt" },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 },
      };
    } else if (period === "week") {
      // Thống kê 7 ngày gần nhất
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      matchCondition.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
      groupBy = {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 },
      };
    }

    const revenueStats = await Order.aggregate([
      { $match: matchCondition },
      { $group: groupBy },
      { $sort: { _id: 1 } },
    ]);

    return successResponse(res, "Lấy thống kê doanh thu thành công", {
      period,
      year: targetYear,
      month: month || null,
      data: revenueStats,
    });
  } catch (error) {
    console.error("Error in getRevenueStats:", error);
    return internalServerErrorResponse(res, "Lỗi server khi lấy thống kê doanh thu");
  }
};

// Thống kê sản phẩm bán chạy
const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $match: { status: { $in: ["delivered", "shipping"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          name: "$product.name",
          image: "$product.image",
          price: "$product.price",
          category: "$product.category",
          totalSold: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
    ]);

    return successResponse(res, "Lấy thống kê sản phẩm bán chạy thành công", topProducts);
  } catch (error) {
    console.error("Error in getTopProducts:", error);
    return internalServerErrorResponse(res, "Lỗi server khi lấy thống kê sản phẩm bán chạy");
  }
};

// Thống kê người dùng
const getUserStats = async (req, res) => {
  try {
    // Chạy các query song song
    const [userRegistrationStats, topCustomers, userStatusStats] = await Promise.all([
      // Thống kê người dùng theo thời gian đăng ký (12 tháng gần nhất)
      User.aggregate([
        { $match: { role: "user" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 },
      ]),

      // Top khách hàng theo tổng giá trị đơn hàng
      Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: "$user_id",
            totalSpent: { $sum: "$totalPrice" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            name: "$user.name",
            email: "$user.email",
            phone: "$user.phone",
            totalSpent: 1,
            orderCount: 1,
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]),

      // Thống kê trạng thái người dùng
      User.aggregate([
        { $match: { role: "user" } },
        {
          $group: {
            _id: "$isActive",
            count: { $sum: 1 },
          },
        },
      ])
    ]);

    return successResponse(res, "Lấy thống kê người dùng thành công", {
      registrationStats: userRegistrationStats,
      topCustomers,
      statusStats: userStatusStats,
    });
  } catch (error) {
    console.error("Error in getUserStats:", error);
    return internalServerErrorResponse(res, "Lỗi server khi lấy thống kê người dùng");
  }
};

// Thống kê đánh giá sản phẩm
const getReviewStats = async (req, res) => {
  try {
    const [ratingStats, avgRatingResult, topRatedProducts] = await Promise.all([
      // Thống kê đánh giá theo rating
      Review.aggregate([
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Đánh giá trung bình toàn hệ thống
      Review.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),

      // Sản phẩm có đánh giá cao nhất (ít nhất 3 đánh giá)
      Review.aggregate([
        {
          $group: {
            _id: "$product_id",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
        { $match: { reviewCount: { $gte: 3 } } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 1,
            name: "$product.name",
            image: "$product.image",
            averageRating: 1,
            reviewCount: 1,
          },
        },
        { $sort: { averageRating: -1 } },
        { $limit: 10 },
      ])
    ]);

    return successResponse(res, "Lấy thống kê đánh giá thành công", {
      ratingDistribution: ratingStats,
      overall: avgRatingResult[0] || { averageRating: 0, totalReviews: 0 },
      topRatedProducts,
    });
  } catch (error) {
    console.error("Error in getReviewStats:", error);
    return internalServerErrorResponse(res, "Lỗi server khi lấy thống kê đánh giá");
  }
};

// Thống kê mã giảm giá
const getCouponStats = async (req, res) => {
  try {
    const [couponStatusStats, topUsedCoupons, discountTypeStats] = await Promise.all([
      // Thống kê mã giảm giá theo trạng thái
      DiscountCoupon.aggregate([
        {
          $addFields: {
            status: {
              $cond: {
                if: { $not: "$isActive" },
                then: "inactive",
                else: {
                  $cond: {
                    if: { $lt: ["$expirationDate", new Date()] },
                    then: "expired",
                    else: {
                      $cond: {
                        if: { $gte: ["$usedCount", "$usageLimit"] },
                        then: "used_up",
                        else: "active",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Top mã giảm giá được sử dụng nhiều nhất
      DiscountCoupon.find()
        .sort({ usedCount: -1 })
        .limit(10)
        .select("code discountType discountValue usedCount usageLimit"),

      // Thống kê theo loại giảm giá
      DiscountCoupon.aggregate([
        {
          $group: {
            _id: "$discountType",
            count: { $sum: 1 },
            totalUsed: { $sum: "$usedCount" },
          },
        },
      ])
    ]);

    return successResponse(res, "Lấy thống kê mã giảm giá thành công", {
      statusStats: couponStatusStats,
      topUsedCoupons,
      typeStats: discountTypeStats,
    });
  } catch (error) {
    console.error("Error in getCouponStats:", error);
    return internalServerErrorResponse(res, "Lỗi server khi lấy thống kê mã giảm giá");
  }
};

// Thống kê theo danh mục sản phẩm
const getCategoryStats = async (req, res) => {
  try {
    const [categoryStats, categoryRevenue] = await Promise.all([
      // Thống kê số lượng sản phẩm mỗi danh mục
      Product.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        { $unwind: "$categoryInfo" },
        {
          $group: {
            _id: "$category",
            categoryName: { $first: "$categoryInfo.name" },
            productCount: { $sum: 1 },
            avgPrice: { $avg: "$price" },
          },
        },
        { $sort: { productCount: -1 } },
      ]),

      // Doanh thu theo danh mục
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$product.category",
            categoryName: { $first: "$category.name" },
            totalRevenue: {
              $sum: { $multiply: ["$items.quantity", "$items.price"] },
            },
            totalQuantitySold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ])
    ]);

    return successResponse(res, "Lấy thống kê danh mục thành công", {
      productStats: categoryStats,
      revenueStats: categoryRevenue,
    });
  } catch (error) {
    console.error("Error in getCategoryStats:", error);
    return internalServerErrorResponse(res, "Lỗi server khi lấy thống kê danh mục");
  }
};

export {
  getOverviewStats,
  getRevenueStats,
  getTopProducts,
  getUserStats,
  getReviewStats,
  getCouponStats,
  getCategoryStats,
};
