# 🍞 TuHuBread Server - REST API

Hệ thống backend cho ứng dụng bán bánh mì TuHuBread, được xây dựng với Node.js và Express. Cung cấp đầy đủ các API cho việc quản lý cửa hàng bánh mì trực tuyến với tính năng bảo mật cao và hiệu suất tối ưu.

## 📋 Mục Lục

- [Tính Năng Chính](#-tính-năng-chính)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt và Chạy Dự Án](#-cài-đặt-và-chạy-dự-án)
- [Cấu Hình Môi Trường](#-cấu-hình-môi-trường)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [API Documentation](#-api-documentation)
- [Bảo Mật](#-bảo-mật)

- [Deployment](#-deployment)

## 🚀 Tính Năng Chính

### 🔐 Xác Thực & Phân Quyền
- JWT Authentication với Access/Refresh Token
- Phân quyền người dùng (Admin, User)
- Session management bảo mật
- Rate limiting và DDoS protection

### 🛍️ Quản Lý Sản Phẩm
- CRUD sản phẩm với upload ảnh
- Quản lý danh mục sản phẩm
- Hệ thống đánh giá và review
- Tìm kiếm và lọc sản phẩm

### 🛒 Giỏ Hàng & Đơn Hàng
- Quản lý giỏ hàng real-time
- Xử lý đơn hàng với nhiều trạng thái
- Tính phí vận chuyển tự động
- Hệ thống mã giảm giá

### 📍 Quản Lý Địa Chỉ & Vận Chuyển
- Quản lý địa chỉ giao hàng
- Tính phí vận chuyển dựa trên OpenStreetMap
- Ước tính thời gian giao hàng
- Hỗ trợ 12 quận trung tâm Hà Nội

### 📊 Thống Kê & Báo Cáo
- Dashboard admin với thống kê real-time
- Báo cáo doanh thu theo thời gian
- Thống kê sản phẩm bán chạy
- Phân tích hành vi người dùng

### 🔔 Thông Báo
- Push notification qua Firebase FCM
- Email notification
- Thông báo trong ứng dụng

## 🛠️ Công Nghệ Sử Dụng

### Backend Framework
- **Express.js** - Web framework
- **Node.js** - Runtime environment
- **MongoDB** - Database với Mongoose ODM

### Authentication & Security
- **JWT** - JSON Web Tokens
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-mongo-sanitize** - NoSQL injection prevention

### File Upload & Storage
- **Cloudinary** - Image storage và optimization
- **Multer** - File upload middleware

### Notifications
- **Firebase Admin SDK** - Push notifications
- **Nodemailer** - Email service

### Development Tools
- **Nodemon** - Development server
- **Morgan** - HTTP request logger

- **AdminJS** - Admin panel

## 📋 Yêu Cầu Hệ Thống

- **Node.js** >= 18.0.0
- **MongoDB** >= 5.0 (Atlas hoặc local)
- **npm** >= 8.0.0

## 🚀 Cài Đặt và Chạy Dự Án

### 1. Clone Repository
```bash
git clone <repository-url>
cd ServerTuHu
```

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Environment Variables
Tạo file `.env` trong thư mục root và cấu hình các biến môi trường (xem phần [Cấu Hình Môi Trường](#-cấu-hình-môi-trường))

### 4. Chạy Dự Án

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

### 5. Import Dữ Liệu Mẫu (Optional)
```bash
# Truy cập endpoint để import dữ liệu mẫu
GET http://localhost:5000/import-data
```

## ⚙️ Cấu Hình Môi Trường

Tạo file `.env` với các biến sau:

### Server Configuration
```env
PORT=5000
NODE_ENV=development
```

### Database Configuration
```env
MONGO_URI=mongodb://localhost:27017/tuhubread
# Hoặc MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=tuhubread
```

### JWT Configuration
```env
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

### Cloudinary Configuration
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET_KEY=your_api_secret
```

### Firebase Configuration
```env
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_client_cert_url
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

**Lưu ý:** `FIREBASE_PRIVATE_KEY` cần thay `\\n` bằng xuống dòng thực sự. Code đã xử lý `replace(/\\n/g, '\n')`.

### Email Configuration (Optional)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📁 Cấu Trúc Dự Án

```
ServerTuHu/
├── src/
│   ├── config/              # Cấu hình database, cloudinary, firebase
│   ├── controllers/         # Business logic
│   ├── middlewares/         # Middleware functions
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── services/           # External services
│   ├── utils/              # Utility functions
│   └── views/              # Email templates
├── scripts/                # Data seeding scripts

├── .env                    # Environment variables
├── server.js              # Entry point
└── package.json           # Dependencies
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Sử dụng Bearer Token trong header:
```
Authorization: Bearer <access_token>
```

### API Endpoints

#### 🔐 Authentication - `/api/auth`
- `POST /register` - Đăng ký tài khoản
- `POST /login` - Đăng nhập
- `POST /logout` - Đăng xuất
- `POST /refresh-token` - Làm mới token
- `POST /forgot-password` - Quên mật khẩu
- `POST /reset-password` - Đặt lại mật khẩu

#### 👥 Users - `/api/users`
- `GET /profile` - Lấy thông tin profile
- `PUT /profile` - Cập nhật profile
- `GET /` - Lấy danh sách users (Admin)
- `DELETE /:id` - Xóa user (Admin)

#### 🍞 Products - `/api/products`
- `GET /` - Lấy danh sách sản phẩm
- `GET /:id` - Lấy chi tiết sản phẩm
- `POST /` - Tạo sản phẩm mới (Admin)
- `PUT /:id` - Cập nhật sản phẩm (Admin)
- `DELETE /:id` - Xóa sản phẩm (Admin)

#### 📂 Categories - `/api/categories`
- `GET /` - Lấy danh sách danh mục
- `POST /` - Tạo danh mục mới (Admin)
- `PUT /:id` - Cập nhật danh mục (Admin)
- `DELETE /:id` - Xóa danh mục (Admin)

#### 🛒 Cart - `/api/carts`
- `GET /` - Lấy giỏ hàng
- `POST /add` - Thêm sản phẩm vào giỏ
- `PUT /update` - Cập nhật số lượng
- `DELETE /remove/:productId` - Xóa sản phẩm khỏi giỏ

#### 📦 Orders - `/api/orders`
- `GET /` - Lấy danh sách đơn hàng
- `GET /:id` - Lấy chi tiết đơn hàng
- `POST /` - Tạo đơn hàng mới
- `PUT /:id/status` - Cập nhật trạng thái đơn hàng (Admin)

#### 📍 Addresses - `/api/addresses`
- `GET /` - Lấy danh sách địa chỉ
- `POST /` - Thêm địa chỉ mới
- `PUT /:id` - Cập nhật địa chỉ
- `DELETE /:id` - Xóa địa chỉ

#### 🚚 Shipping - `/api/shipping`
- `GET /fee/:addressId` - Tính phí vận chuyển
- `POST /calculate` - Tính phí từ địa chỉ mới

#### 🎫 Discount Coupons - `/api/discount-coupons`
- `GET /` - Lấy danh sách mã giảm giá
- `POST /apply` - Áp dụng mã giảm giá
- `POST /` - Tạo mã giảm giá (Admin)

#### ⭐ Reviews - `/api/reviews`
- `GET /product/:productId` - Lấy review của sản phẩm
- `POST /` - Tạo review mới
- `PUT /:id` - Cập nhật review
- `DELETE /:id` - Xóa review

#### 🔔 Notifications - `/api/notifications`
- `GET /` - Lấy danh sách thông báo
- `PUT /:id/read` - Đánh dấu đã đọc
- `POST /send` - Gửi thông báo (Admin)

#### 📊 Statistics - `/api/statistics`
- `GET /dashboard` - Thống kê tổng quan (Admin)
- `GET /revenue` - Thống kê doanh thu (Admin)
- `GET /products` - Thống kê sản phẩm (Admin)

#### 🎨 Banners - `/api/banners`
- `GET /` - Lấy danh sách banner
- `POST /` - Tạo banner mới (Admin)
- `PUT /:id` - Cập nhật banner (Admin)
- `DELETE /:id` - Xóa banner (Admin)

## 🔒 Bảo Mật

### Middleware Bảo Mật
- **Security Headers** - Helmet.js
- **Rate Limiting** - Giới hạn request per IP
- **Input Validation** - Sanitize và validate input
- **SQL/NoSQL Injection Prevention** - Mongoose sanitizer
- **Session Security** - Secure cookie configuration
- **DDoS Protection** - Progressive slow down

### Authentication Flow
1. User đăng nhập với email/password
2. Server trả về Access Token (15 phút) và Refresh Token (7 ngày)
3. Client sử dụng Access Token cho các request
4. Khi Access Token hết hạn, sử dụng Refresh Token để lấy token mới



## 🚀 Deployment

### Environment Setup
1. Cấu hình production environment variables
2. Setup MongoDB Atlas hoặc MongoDB server
3. Cấu hình Cloudinary account
4. Setup Firebase project

### Deploy Commands
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Recommended Hosting
- **Heroku** - Easy deployment
- **DigitalOcean** - VPS hosting
- **AWS EC2** - Scalable cloud hosting
- **Vercel** - Serverless deployment

## 📝 Changelog

### Version 1.0.0
- Initial release với đầy đủ tính năng cơ bản
- Hệ thống authentication và authorization
- CRUD operations cho tất cả entities
- Tính phí vận chuyển với OpenStreetMap
- Admin dashboard với AdminJS

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép ISC. Xem file `LICENSE` để biết thêm chi tiết.

## 👨‍💻 Author

**duongnd** - Developer

## 📞 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue trên GitHub repository.

---

⭐ Nếu dự án này hữu ích, hãy cho chúng tôi một star trên GitHub!


