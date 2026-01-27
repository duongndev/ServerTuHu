import express from "express";
const app = express();
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import { notFound, errorHandler } from "./middlewares/middleware.js";
import { securityMiddleware, cookieSecurityMiddleware, clearInsecureCookies } from "./middlewares/securityHeaders.middleware.js";
import { 
  sanitizeInputs, 
  detectSQLInjection 
} from "./middlewares/inputValidation.middleware.js";
import { 
  noSQLSanitizer, 
  detectNoSQLInjection, 
  validateMongoQueries,
  logDatabaseQueries,
  preventEnumeration 
} from "./middlewares/databaseSecurity.middleware.js";
import { 
  generalRateLimit, 
  progressiveSlowDown, 
  adaptiveRateLimit,
  trackFailedAttempts,
  ddosProtection 
} from "./middlewares/rateLimiting.middleware.js";
import logger from "morgan";
import cookieParser from "cookie-parser";


import dotenv from "dotenv";
dotenv.config();
connectDB();


// Apply security middleware first
app.set('trust proxy', 1);
app.use(securityMiddleware);

// Session and cookie security
app.use(clearInsecureCookies);
app.use(cookieParser());
app.use(cookieSecurityMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input validation and sanitization
app.use(sanitizeInputs);
app.use(detectSQLInjection);

// Database security
app.use(noSQLSanitizer);
app.use(detectNoSQLInjection);
app.use(validateMongoQueries);
app.use(logDatabaseQueries);
app.use(preventEnumeration);

// Rate limiting and DDoS protection
app.use(ddosProtection);
app.use(generalRateLimit);
app.use(progressiveSlowDown);
app.use(adaptiveRateLimit);
app.use(trackFailedAttempts);

app.use(logger("dev"));

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
import healthRoutes from "./routes/health.router.js";
import zalopayRoutes from "./routes/zalopay.router.js";

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
app.use("/api/zalopay", zalopayRoutes);
app.use("/health", healthRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});






app.use(notFound);
app.use(errorHandler);

export default app;
