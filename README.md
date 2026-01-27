# 🍞 TuHuBread Server

Backend REST API cho ứng dụng bán bánh mì TuHuBread, xây dựng với Node.js/Express, MongoDB Atlas và Docker.

## ✨ Tính năng nổi bật

- **🔐 Xác thực & Phân quyền**: JWT với Access/Refresh token, quản lý session an toàn
- **🛒 Quản lý bán hàng**: Sản phẩm, giỏ hàng, đơn hàng, mã giảm giá, phí vận chuyển
- **📸 Media & Notifications**: Upload ảnh Cloudinary, thông báo Firebase FCM, email
- **🛡️ Bảo mật**: Rate limiting, security headers, input sanitization

## 📋 Yêu cầu hệ thống

- **Node.js** >= 22
- **npm** >= 10
- **MongoDB Atlas** (Network Access đã được bật)

## 🚀 Cài đặt nhanh

```bash
# Clone repository
git clone https://github.com/duongndev/ServerTuHu.git && cd ServerTuHu

# Cài đặt dependencies
npm ci

# Cấu hình environment
cp .env.example .env
# Chỉnh sửa .env với các biến:
# - MONGO_ATLAS_URI, MONGO_ATLAS_DB, MONGO_ATLAS_USER, MONGO_ATLAS_PASS
# - JWT_SECRET, SESSION_SECRET
# - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
# - FIREBASE_* (nếu dùng FCM)

# Chạy development server
npm run dev
# Server chạy tại http://localhost:5000
```

## 🐳 Docker

### Build & Run
```bash
# Build image
docker build -t duongnd202/tuhu-bread:latest .

# Run container
docker run --env-file .env -p 5000:5000 duongnd202/tuhu-bread:latest
```

### Docker Compose
```bash
# Sử dụng MongoDB Atlas
docker-compose up --build -d
```

**Healthcheck**: `GET /health` phải trả về status 200

## 🔄 CI/CD Pipeline

**GitHub Actions → Docker Hub**

- **Node.js 22** cho test job
- **Docker Buildx** cho multi-platform build
- **Auto-tagging**: `latest` và `<GIT_SHA>`

**Required Secrets**:
- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `MONGO_ATLAS_*` variables

## 📁 Cấu trúc dự án

```
src/
├── config/          # Database, Cloudinary, Firebase config
├── controllers/     # Business logic handlers
├── middlewares/     # Security, validation, session middleware
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── services/        # Email, notification services
├── utils/           # Utility functions (pricing, validation)
├── views/           # Email/OTP templates
└── app.js           # Express app setup
server.js            # Application entry point
```

## 🔗 API Endpoints

### Health & System
- `GET /health` - Server health check (Docker HEALTHCHECK)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

## 🔒 Bảo mật & Vận hành

- **MongoDB Atlas**: Yêu cầu TLS/SSL trong production
- **Network Access**: Cấu hình IP Allowlist hoặc `0.0.0.0/0` cho testing
- **Environment Variables**: Không commit `.env`, sử dụng `.env.example`

## 🛠️ Khắc phục sự cố

### Common Issues
- **Node.js Version**: Yêu cầu Node >= 22 để tránh lỗi `jsdom`/`webidl-conversions`
- **Line Endings**: `.gitattributes` đã cấu hình để chuẩn hóa CRLF/LF trên Windows
- **Atlas Connection**: 
  - Kiểm tra format `MONGO_ATLAS_URI` (bao gồm `user:pass@`)
  - Xác nhận Network Access settings
  - Verify credentials trong `.env`

### Debug Commands
```bash
# Kiểm tra Node version
node --version

# Test connection
npm run test

# Check logs
docker logs <container_id>
```

## 📄 Giấy phép

Dự án nội bộ - không kèm license công khai.

---

**Contact**: [Your Contact Information]  
**Repository**: https://github.com/duongndev/ServerTuHu