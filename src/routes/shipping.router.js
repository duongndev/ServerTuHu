import express from "express";
const router = express.Router();
import * as shippingController from "../controllers/shipping.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";

function validateObjectId(req, res, next) {
  const id = req.params.addressId;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid addressId" });
  }
  next();
}

// Tính phí vận chuyển từ địa chỉ đã lưu
router.get(
  "/fee/:addressId",
  protect,
  validateObjectId,
  shippingController.calculateShippingFee
);

// Tính phí vận chuyển từ địa chỉ cụ thể
router.post(
  "/fee/calculate",
  protect,
  shippingController.calculateShippingFeeFromAddress
);

// Lấy thông tin chi tiết về địa chỉ
router.get(
  "/address-info/:addressId",
  protect,
  validateObjectId,
  shippingController.getAddressInfo
);

// Lấy danh sách các trung tâm Hà Nội (public)
router.get("/centers", shippingController.getHanoiCenters);

export default router;
