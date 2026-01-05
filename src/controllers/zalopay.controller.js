import ZaloPayService from "../service/zalopay.service.js";
import orderModel from "../models/order.model.js";

const zaloPayController = {
  callback: async (req, res) => {
    let result = {};
    try {
      const { data: dataStr, mac } = req.body;
      const isValid = ZaloPayService.verifyCallback(dataStr, mac);

      if (!isValid) {
        result.return_code = -1;
        result.return_message = "mac not equal";
      } else {
        const dataJson = JSON.parse(dataStr);
        const app_trans_id = dataJson.app_trans_id;

        // Tìm đơn hàng theo transaction_id
        const order = await orderModel.findOne({
          transaction_id: app_trans_id,
        });

        if (order) {
          // Cập nhật trạng thái đơn hàng
          order.payment_status = "paid";
          order.payment_date = new Date();
          order.zp_trans_id = dataJson.zp_trans_id; // Lưu lại mã giao dịch của ZaloPay
          // Có thể cập nhật trạng thái đơn hàng sang confirmed
          if (order.status === "pending") {
            order.status = "confirmed";
          }
          await order.save();

          result.return_code = 1;
          result.return_message = "success";
          console.log(`ZaloPay Callback: Order ${order._id} paid successfully.`);
        } else {
            // Trường hợp không tìm thấy order (có thể do lỗi lưu transaction_id trước đó)
            // Tuy nhiên ZaloPay vẫn cần phản hồi thành công để không retry
            console.error(`ZaloPay Callback: Order with trans_id ${app_trans_id} not found.`);
            result.return_code = 1; // Vẫn trả về 1 để ZaloPay không gửi lại
            result.return_message = "success";
        }
      }
    } catch (error) {
      result.return_code = 0; // ZaloPay documentation says 0 is exception
      result.return_message = error.message;
      console.error("ZaloPay Callback Error:", error);
    }

    res.json(result);
  },

  refund: async (req, res) => {
    try {
      const { orderId, description } = req.body;
      
      const order = await orderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.payment_method !== "zalopay" || !order.zp_trans_id) {
        return res.status(400).json({ message: "Order not paid via ZaloPay or missing ZaloPay transaction ID" });
      }

      if (order.payment_status === "refunded") {
         return res.status(400).json({ message: "Order already refunded" });
      }

      const result = await ZaloPayService.refundPayment(order.zp_trans_id, order.total_price, description);

      if (result.return_code === 1) {
          order.payment_status = "refunded";
          order.status = "canceled"; // Hoặc trạng thái khác tùy nghiệp vụ
          order.refund_id = result.m_refund_id;
          await order.save();
          return res.status(200).json({ success: true, data: result });
      } else {
          return res.status(400).json({ success: false, message: result.return_message, data: result });
      }

    } catch (error) {
       console.error("ZaloPay Refund Controller Error:", error);
       res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  },
  
  checkRefundStatus: async (req, res) => {
      try {
          const { refundId } = req.params;
          const result = await ZaloPayService.checkRefundStatus(refundId);
          res.json(result);
      } catch (error) {
          console.error("ZaloPay Check Refund Status Controller Error:", error);
          res.status(500).json({ message: "Internal Server Error", error: error.message });
      }
  }
};

export default zaloPayController;
