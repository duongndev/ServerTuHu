import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const newToken = async (user) => {
  return await jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

const verifyToken = async (token) => {
  return await jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Helper: Chuẩn hóa response trả về
function standardResponse(res, status, { success, message, data = null, pagination = null }) {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(status).json(response);
}

// Helper: Validate email format
function validateEmail(email) {
  // Đơn giản: kiểm tra có ký tự @ và .
  return typeof email === 'string' && /.+@.+\..+/.test(email);
}

export {
  newToken,
  verifyToken,
  hashPassword,
  comparePassword,
  standardResponse,
  validateEmail,
};
