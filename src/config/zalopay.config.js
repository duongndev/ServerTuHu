import dotenv from 'dotenv';
dotenv.config();

export const zalopayConfig = {
  appid: process.env.ZALOPAY_APP_ID,
  key1: process.env.ZALOPAY_KEY1,
  key2: process.env.ZALOPAY_KEY2,
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  query_endpoint: "https://sb-openapi.zalopay.vn/v2/query",
  refund_endpoint: "https://sb-openapi.zalopay.vn/v2/refund",
  refund_query_endpoint: "https://sb-openapi.zalopay.vn/v2/query_refund",
  callback_url: process.env.ZALOPAY_CALLBACK_URL || "http://localhost:5000/api/zalopay/callback",
};

