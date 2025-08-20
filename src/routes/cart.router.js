import express from "express";
const router = express.Router();
import * as cartCtrl from "../controllers/cart.controller.js"; 
import { protect, authorize } from "../middlewares/auth.middleware.js";

router.use(protect);

router.post("/", authorize("user"), cartCtrl.addToCart);

router.get("/user", authorize("user"), cartCtrl.getUserCart);

router.post("/increase", authorize("user"), cartCtrl.increaseQuantity);

router.post("/decrease", authorize("user"), cartCtrl.decreaseQuantity);

router.delete("/remove", authorize("user"), cartCtrl.removeFromCart);

router.get("/user/count", authorize("user"), cartCtrl.getCountItemInCart);


export default router;
