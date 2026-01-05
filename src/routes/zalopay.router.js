import express from "express";
import zaloPayController from "../controllers/zalopay.controller.js";

const router = express.Router();

router.post("/callback", zaloPayController.callback);
router.post("/refund", zaloPayController.refund);
router.get("/refund/:refundId", zaloPayController.checkRefundStatus);

export default router;
