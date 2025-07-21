const express = require("express");
const app = express();
const { connectDB, connectCloudinary } = require("../src/config/db");
const cors = require("cors");
const { notFound, errorHandler } = require("../src/middlewares/middleware");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

require("dotenv").config();
connectDB();
connectCloudinary();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(logger("dev"));
app.use(cookieParser());

// routes
const orderRoutes = require("./routes/order.router");
const authRoutes = require("./routes/auth.router");
const userRoutes = require("./routes/user.router");
const productRoutes = require("./routes/product.router");
const categoryRoutes = require("./routes/category.router");
const reviewRoutes = require("./routes/review.router");
const addressRoutes = require("./routes/address.router");
const discountCouponRoutes = require("./routes/discountCoupon.router");
const shippingRoutes = require("./routes/shipping.router");
const cartRoutes = require("./routes/cart.router");

app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/discount-coupons", discountCouponRoutes);
app.use("/api/shipping", shippingRoutes);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
