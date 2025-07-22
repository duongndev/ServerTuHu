import { verifyToken } from "../utils/utility.function.js";
import User from "../models/user.model.js";

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = await verifyToken(token);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }
      next();
    } catch (error) {
      res
        .status(401)
        .json({ message: "Token is invalid", error: error });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Token is required" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).json({ message: "You are not authorized" });
    }
    next();
  };
};

export {
  protect,
  authorize,
};
