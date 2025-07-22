import AdminJS from "adminjs";
import AdminJSExpress, { log } from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import bcrypt from "bcryptjs"; 

// Import models
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Order from "../models/order.model.js";
import DiscountCoupon from "../models/discountCoupon.model.js";
import Review from "../models/review.model.js";
import Address from "../models/address.model.js";
import Notification from "../models/notification.model.js";

AdminJS.registerAdapter(AdminJSMongoose);

// Secret keys
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";
const ADMIN_COOKIE_SECRET =
  process.env.ADMIN_COOKIE_SECRET || "supersecretcookypassword";

const buildAdminRouter = () => {
  const adminJs = new AdminJS({
    rootPath: "/admin",
    resources: [
      User,
      Product,
      Category,
      Order,
      DiscountCoupon,
      Review,
      Address,
      Notification,
    ].map((model) => ({
      resource: model,
      options: {
        actions: {
          new: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          edit: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          delete: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          list: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          show: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
        },
      },
    })),
    branding: {
      companyName: "TuHuBreadServer Admin",
      softwareBrothers: false,
    },
  });


  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
    authenticate: async (email, password) => {
      try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
          // Chỉ cho phép người dùng có role = admin
          if (user.role === 'admin') {
            // Tạo token nếu cần, hoặc trả về thông tin người dùng cần thiết
            // Lưu ý: AdminJS không yêu cầu token ở đây, chỉ cần trả về đối tượng user
            return { email: user.email, role: user.role };
          }
        }
        return null;
      } catch (err) {
        console.error('Login failed:', err.message);
        return null;
      }
    },
    cookieName: "adminjs",
    cookiePassword: ADMIN_COOKIE_SECRET,
  });

  return { adminJs, adminRouter };
};

export default buildAdminRouter;
