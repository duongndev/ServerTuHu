import productModel from "../models/product.model.js";
import userModel from "../models/user.model.js";
import cartModel from "../models/cart.model.js";
import orderModel from "../models/order.model.js";
import discountCouponModel from "../models/discountCoupon.model.js";
import {
  sendToAdmin,
  sendToUser,
  sendToBoth,
} from "../service/notification.service.js";
import { standardResponse } from "../utils/utility.function.js";

// Helper: Chuẩn hóa populate cho order
const orderPopulate = [
  { path: "user_id", select: "fullName email" },
  { path: "items.product_id", select: "name imgUrl price discountPrice" },
  { path: "couponInfo", select: "code discountType discountAmount" },
];

// Helper: Validate order status
const validOrderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const validPaymentStatuses = ["paid", "failed"];
const validPaymentMethods = ["cash", "zalopay", "momo", "vnpay"];

/**
 * Tạo đơn hàng mới
 * @param {Object} req.body - thông tin đơn hàng
 * @param {string} req.body.items - danh sách sản phẩm
 * @param {Object} req.body.shippingAddress - thông tin giao hàng
 * @param {string} req.body.paymentMethod - phương thức thanh toán
 * @param {string} req.body.couponCode - mã giảm giá
 * @param {string} req.body.notes - ghi chú
 * @param {string} req.body.phoneNumber - số điện thoại
 * @param {ObjectId} req.user._id - ID người dùng
 * @return {Promise<Object>} - trả về thông tin đơn hàng
 */
const createOrder = async (req, res) => {
  try {
    const {
      items,
      shipping_address,
      payment_method,
      coupo_code,
      notes,
      delivery_fee,
    } = req.body;
    const user_id = req.user._id;
    // Validate đầu vào
    if (
      !items ||
      !delivery_fee ||
      isNaN(delivery_fee) ||
      delivery_fee < 0 ||
      !payment_method ||
      !shipping_address ||
      !shipping_address.receiver_name ||
      !shipping_address.phone ||
      !shipping_address.full_address
    ) {
      return standardResponse(res, 400, {
        success: false,
        message:
          "Vui lòng nhập đầy đủ thông tin đơn hàng và phí vận chuyển hợp lệ",
      });
    }
    // Validate user
    const user = await userModel.findById(user_id);
    if (!user) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    // Xử lý sản phẩm và tính tổng
    const orderItems = [];
    let subtotal = 0;
    for (const { product_id, quantity } of items) {
      if (!product_id || !quantity || quantity <= 0) {
        return standardResponse(res, 400, {
          success: false,
          message: "Thông tin sản phẩm không hợp lệ",
        });
      }
      const product = await productModel
        .findById(product_id)
        .select("name price discountPrice isOnSale inventory isAvailable");
      if (!product) {
        return standardResponse(res, 404, {
          success: false,
          message: `Không tìm thấy sản phẩm có ID: ${product_id}`,
        });
      }
      if (!product.isAvailable) {
        return standardResponse(res, 400, {
          success: false,
          message: `Sản phẩm ${product.name} hiện không có sẵn`,
        });
      }
      const price = product.isOnSale ? product.discountPrice : product.price;
      const total = price * quantity;
      subtotal += total;
      orderItems.push({ product_id, price, quantity, total });
    }
    // Xử lý mã giảm giá nếu có
    let discountAmount = 0;
    if (coupo_code) {
      const coupon = await discountCouponModel.findOne({
        code: coupo_code,
        isActive: true,
      });
      if (!coupon) {
        return standardResponse(res, 400, {
          success: false,
          message: "Mã giảm giá không hợp lệ",
        });
      }
      if (coupon.usageLimit && coupon.usageLimit <= coupon.usedCount) {
        return standardResponse(res, 400, {
          success: false,
          message: "Mã giảm giá đã hết lượt sử dụng",
        });
      }
      const orderSubtotal = subtotal + Number(delivery_fee);
      if (orderSubtotal < coupon.minimumOrderAmount) {
        return standardResponse(res, 400, {
          success: false,
          message: "Số tiền tối thiểu của đơn hàng không hợp lệ",
        });
      }
      discountAmount =
        coupon.discountType === "percentage"
          ? (coupon.discountValue / 100) * orderSubtotal
          : coupon.discountValue;
      await discountCouponModel.updateOne(
        { _id: coupon._id },
        { $inc: { usedCount: 1 } }
      );
    }
    // Tạo đơn hàng
    const order = await orderModel.create({
      user_id,
      items: orderItems,
      shipping_address: {
        receiver_name: shipping_address.receiver_name,
        phone: shipping_address.phone,
        full_address: shipping_address.full_address,
      },
      payment_method: payment_method,
      delivery_fee: Number(delivery_fee),
      subtotal,
      discount_amount: discountAmount,
      total_price: subtotal + Number(delivery_fee) - discountAmount,
      notes,
      coupon_code: coupo_code,
    });
    // Xóa sản phẩm đã đặt khỏi giỏ hàng
    const cart = await cartModel.findOne({ user_id });
    if (cart) {
      cart.items = cart.items.filter(
        (ci) =>
          !orderItems.some(
            (oi) => oi.product_id.toString() === ci.product_id.toString()
          )
      );
      cart.totalPrice = cart.items.reduce(
        (sum, ci) => sum + ci.price * ci.quantity,
        0
      );
      await cart.save();
    }
    // Gửi thông báo cho admin qua Firebase
    try {
      await sendToAdmin({
        title: "Bạn có đơn hàng mới",
        message: `Mã đơn hàng: ${order._id}. Tổng tiền: ${order.total_price}`,
        type: "order_new",
        sender: user_id,
        order_id: order._id,
      });
    } catch (error) {
      console.log(error);
      return standardResponse(res, 500, {
        success: false,
        message: "Lỗi khi gửi thông báo đến admin",
        error: error.message,
      });
    }
    return standardResponse(res, 201, {
      success: true,
      message: "Tạo đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.log(error);

    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi tạo đơn hàng",
      error: error.message,
    });
  }
};

/**
 * @desc Lấy danh sách đơn hàng của người dùng
 * @route GET /api/orders/user/:userId
 * @access Private (User)
 * @param {string} userId - id của người dùng
 * @returns {object} - danh sách đơn hàng
 */
const getOrdersByUserId = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ user_id: req.user.id })
      .populate(orderPopulate);
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

/**
 * @desc Lấy thông tin chi tiết của một đơn hàng
 * @route GET /api/orders/:orderId
 * @access Private (Admin, User)
 * @param {string} orderId - id của đơn hàng
 * @returns {object} - thông tin chi tiết của đơn hàng
 */
const getOrderById = async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.orderId)
      .populate(orderPopulate);
    if (!order) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thông tin đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy thông tin đơn hàng",
      error: error.message,
    });
  }
};

/**
 * @desc Cập nhật trạng thái của một đơn hàng
 * @route PUT /api/orders/:orderId
 * @access Private (Admin)
 * @param {string} orderId - id của đơn hàng
 * @param {string} status - trạng thái mới của đơn hàng
 * @returns {object} - thông tin chi tiết của đơn hàng sau khi cập nhật
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status || !validOrderStatuses.includes(status)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Trạng thái đơn hàng không hợp lệ",
      });
    }
    const order = await orderModel.findById(orderId);
    if (!order) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }
    order.status = status;
    await order.save();
    try {
      await sendToUser({
        userId: order.user_id,
        title: "Cập nhật trạng thái đơn hàng",
        message: `Đơn hàng ${orderId} đã được cập nhật sang trạng thái: ${status}`,
        type: "order_status_update",
        orderId: order._id,
        sender: req.user._id,
      });
    } catch (error) {
      // Không trả lỗi notification cho client
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi cập nhật trạng thái đơn hàng",
      error: error.message,
    });
  }
};

/**
 * @desc Cập nhật trạng thái thanh toán của một đơn hàng
 * @route PATCH /api/orders/:orderId
 * @access Private (User)
 * @param {string} orderId - id của đơn hàng
 * @param {string} paymentStatus - trạng thái thanh toán (paid, failed)
 * @param {string} paymentMethod - phương thức thanh toán (cash, zalopay, momo, vnpay)
 * @returns {object} - thông tin chi tiết của đơn hàng
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentMethod } = req.body;
    if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Trạng thái thanh toán không hợp lệ",
      });
    }
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Phương thức thanh toán không hợp lệ",
      });
    }
    const order = await orderModel.findById(orderId);
    if (!order) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }
    order.paymentStatus = paymentStatus;
    order.paymentDate = Date.now();
    order.paymentMethod = paymentMethod;
    await order.save();
    if (paymentStatus === "paid") {
      try {
        await sendToAdmin({
          title: "Thanh toán đơn hàng",
          message: `Đơn hàng ${orderId} đã được thanh toán qua: ${paymentMethod}`,
          type: "payment_status_update",
          orderId: order._id,
          sender: req.user._id,
        });
      } catch (error) {}
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Cập nhật trạng thái thanh toán thành công",
      data: order,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi cập nhật trạng thái thanh toán",
      error: error.message,
    });
  }
};

/**
 * @desc Hủy một đơn hàng
 * @route DELETE /api/orders/cancel
 * @access Private (User, Admin)
 * @param {string} orderId - ID của đơn hàng cần hủy
 * @param {string} cancelReason - Lý do hủy đơn hàng
 * @returns {object} - Thông tin chi tiết của đơn hàng đã hủy
 */

const cancelOrder = async (req, res) => {
  try {
    const { orderId, cancelReason } = req.body;
    let userId = null;
    let adminId = null;
    if (req.user.role === "user") {
      userId = req.user.id;
    } else if (req.user.role === "admin") {
      adminId = req.user.id;
    }
    const order = await orderModel.findById(orderId);
    if (!order) {
      return standardResponse(res, 404, {
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }
    if (order.status !== "pending") {
      return standardResponse(res, 400, {
        success: false,
        message: "Chỉ có thể hủy đơn hàng khi chưa xác nhận",
      });
    }
    if (userId && order.user_id.toString() !== userId.toString()) {
      return standardResponse(res, 403, {
        success: false,
        message: "Bạn không có quyền hủy đơn hàng này",
      });
    }
    order.status = "cancelled";
    order.cancelReason = cancelReason;
    await order.save();
    const notificationData = {
      title: "Đơn hàng đã bị hủy",
      message: `Đơn hàng #${order._id} đã bị hủy từ người dùng.`,
      type: "order_cancelled",
      orderId: order._id,
      sender: req.user._id,
    };
    if (userId && adminId) {
      await sendToBoth(userId, adminId, notificationData);
    } else if (userId) {
      await sendToUser(userId, notificationData);
      await sendToAdmin(notificationData);
    } else if (adminId) {
      await sendToUser(order.user_id, notificationData);
      await sendToAdmin(notificationData);
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi hủy đơn hàng",
      error: error.message,
    });
  }
};

// Lấy toàn bộ danh sách order cho admin (có thể lọc theo trạng thái và ngày)
const getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (status) {
      if (!validOrderStatuses.includes(status)) {
        return standardResponse(res, 400, {
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const totalOrders = await orderModel.countDocuments(query);
    const orders = await orderModel
      .find(query)
      .populate([
        { path: "user_id", select: "fullName email" },
        { path: "items.product_id", select: "name imgUrl price discountPrice" },
        { path: "couponInfo", select: "code discountType discountAmount" },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalOrders / limit);

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy danh sách tất cả đơn hàng thành công",
      data: orders,
      pagination: {
        limit,
        total: totalOrders,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

export {
  createOrder,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getOrdersByUserId,
  cancelOrder,
  getAllOrders,
};
