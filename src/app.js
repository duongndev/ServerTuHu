import express from "express";
const app = express();
import { connectDB, connectCloudinary } from "../src/config/db.js";
import cors from "cors";
import { notFound, errorHandler } from "../src/middlewares/middleware.js";
import logger from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import buildAdminRouter from '../src/config/admin.js'

import dotenv from 'dotenv'
dotenv.config()
connectDB();
connectCloudinary();

// Tích hợp AdminJS
const { adminJs, adminRouter } = buildAdminRouter(app)
app.use(adminJs.options.rootPath, adminRouter)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(logger("dev"));
app.use(cookieParser());

// routes
import orderRoutes from "./routes/order.router.js";
import authRoutes from "./routes/auth.router.js";
import userRoutes from "./routes/user.router.js";
import productRoutes from "./routes/product.router.js";
import categoryRoutes from "./routes/category.router.js";
import reviewRoutes from "./routes/review.router.js";
import addressRoutes from "./routes/address.router.js";
import discountCouponRoutes from "./routes/discountCoupon.router.js";
import shippingRoutes from "./routes/shipping.router.js";
import cartRoutes from "./routes/cart.router.js";
import notificationRouter from "./routes/notification.router.js";
import statisticsRouter from "./routes/statistics.router.js";
import bannerRoutes from "./routes/banner.routes.js";


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
app.use("/api/notifications", notificationRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/banners", bannerRoutes);


app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
});

app.use(notFound);
app.use(errorHandler);

export default app;
