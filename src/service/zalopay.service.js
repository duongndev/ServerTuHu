import axios from "axios";
import crypto from "crypto";
import { zalopayConfig } from "../config/zalopay.config.js";

const ZaloPayService = {
  createPaymentRequest: async (order) => {
    const embed_data = {
      redirecturl: order.redirect_url || "http://localhost:5000/order-success", // Đường dẫn trả về sau khi thanh toán trên app/web
    };

    const items = order.items.map((item) => ({
      itemid: item.product_id,
      itemname: item.name, // Cần đảm bảo order.items có name hoặc query từ DB
      itemprice: item.price,
      itemquantity: item.quantity,
    }));

    const transID = Math.floor(Math.random() * 1000000);
    const date = new Date();
    const yy = date.getFullYear().toString().slice(2);
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    const app_trans_id = `${yy}${mm}${dd}_${transID}`;

    const orderData = {
      app_id: zalopayConfig.app_id,
      app_user: order.user_id.toString(),
      app_time: Date.now(), // miliseconds
      amount: order.total_price,
      app_trans_id: app_trans_id,
      embed_data: JSON.stringify(embed_data),
      item: JSON.stringify(items),
      description: `Thanh toán đơn hàng #${order._id} - TuHuBread`,
      bank_code: "",
      callback_url: zalopayConfig.callback_url
    };

    // app_id|app_trans_id|app_user|amount|app_time|embed_data|item
    const data =
      zalopayConfig.app_id +
      "|" +
      orderData.app_trans_id +
      "|" +
      orderData.app_user +
      "|" +
      orderData.amount +
      "|" +
      orderData.app_time +
      "|" +
      orderData.embed_data +
      "|" +
      orderData.item;

    orderData.mac = crypto
      .createHmac("sha256", zalopayConfig.key1)
      .update(data)
      .digest("hex");

    try {
      const result = await axios.post(zalopayConfig.endpoint, null, {
        params: orderData,
      });
      
      return {
        ...result.data,
        app_trans_id: app_trans_id // Trả về để lưu vào DB nếu cần
      };
    } catch (error) {
      console.error("ZaloPay Create Order Error:", error.message);
      throw error;
    }
  },

  verifyCallback: (data, mac) => {
    const reqMac = crypto
      .createHmac("sha256", zalopayConfig.key2)
      .update(data)
      .digest("hex");

    return reqMac === mac;
  },
  
  checkOrderStatus: async (app_trans_id) => {
      const postData = {
          app_id: zalopayConfig.app_id,
          app_trans_id: app_trans_id,
      }
      
      const data = postData.app_id + "|" + postData.app_trans_id + "|" + zalopayConfig.key1;
      
      postData.mac = crypto.createHmac("sha256", zalopayConfig.key1).update(data).digest("hex");
      
      try {
          const result = await axios.post(zalopayConfig.query_endpoint, null, { params: postData });
          return result.data;
      } catch (error) {
          console.error("ZaloPay Check Status Error:", error.message);
          throw error;
      }
  },

  refundPayment: async (zp_trans_id, amount, description) => {
    const timestamp = Date.now();
    const uid = `${timestamp}${Math.floor(111 + Math.random() * 888)}`; // unique id

    const refundReq = {
      app_id: zalopayConfig.app_id,
      m_refund_id: `${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}_${zalopayConfig.app_id}_${uid}`,
      zp_trans_id: zp_trans_id,
      amount: amount,
      timestamp: timestamp,
      description: description || "Refund order",
    };

    // app_id|zp_trans_id|amount|description|timestamp
    const data =
      refundReq.app_id +
      "|" +
      refundReq.zp_trans_id +
      "|" +
      refundReq.amount +
      "|" +
      refundReq.description +
      "|" +
      refundReq.timestamp;

    refundReq.mac = crypto
      .createHmac("sha256", zalopayConfig.key1)
      .update(data)
      .digest("hex");

    try {
      const result = await axios.post(zalopayConfig.refund_endpoint, null, {
        params: refundReq,
      });
      return result.data;
    } catch (error) {
      console.error("ZaloPay Refund Error:", error.message);
      throw error;
    }
  },

  checkRefundStatus: async (m_refund_id) => {
    const params = {
      app_id: zalopayConfig.app_id,
      m_refund_id: m_refund_id,
      timestamp: Date.now(),
    };

    const data = params.app_id + "|" + params.m_refund_id + "|" + params.timestamp;
    params.mac = crypto
      .createHmac("sha256", zalopayConfig.key1)
      .update(data)
      .digest("hex");

    try {
      const result = await axios.post(zalopayConfig.refund_query_endpoint, null, {
        params: params,
      });
      return result.data;
    } catch (error) {
      console.error("ZaloPay Check Refund Status Error:", error.message);
      throw error;
    }
  }
};

export default ZaloPayService;
