import express from "express";
const router = express.Router();
import * as cartCtrl from "../controllers/cart.controller.js"; 
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { burstProtection } from "../middlewares/rateLimiting.middleware.js";

router.use(protect);

router.post("/", authorize("user"), burstProtection, cartCtrl.addToCart);

router.get("/user", authorize("user"), burstProtection, cartCtrl.getUserCart);

router.post("/increase", authorize("user"), burstProtection, cartCtrl.increaseQuantity);

router.post("/decrease", authorize("user"), burstProtection, cartCtrl.decreaseQuantity);

router.delete("/remove", authorize("user"), burstProtection, cartCtrl.removeFromCart);

router.get("/user/count", authorize("user"), burstProtection, cartCtrl.getCountItemInCart);


export default router;
