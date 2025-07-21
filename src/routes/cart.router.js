const router = require("express").Router();
const cartCtrl = require("../controllers/cart.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect);

router.post("/", authorize("user"), cartCtrl.addToCart);

router.get("/user", authorize("user"), cartCtrl.getUserCart);

router.post("/increase", authorize("user"), cartCtrl.increaseQuantity);

router.post("/decrease", authorize("user"), cartCtrl.decreaseQuantity);

router.delete("/remove", authorize("user"), cartCtrl.removeFromCart);

module.exports = router;