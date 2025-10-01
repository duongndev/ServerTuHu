## TuHuBreadServer - REST API

Node.js/Express server cho ứng dụng bán bánh mì TuHuBread. Cung cấp các API cho xác thực, người dùng, sản phẩm, danh mục, giỏ hàng, đơn hàng, đánh giá, địa chỉ, mã giảm giá, phí vận chuyển, thống kê, banner và thông báo.

### Công nghệ chính
- Express, Mongoose
- JWT Auth (Access/Refresh)
- Cloudinary (upload ảnh)
- Firebase Admin (FCM)
- Morgan, CORS, Cookie Parser

### Yêu cầu hệ thống
- Node 18+
- MongoDB (Atlas/local)

### Cấu hình môi trường (.env)
Các biến quan trọng (tùy hệ thống có thể cần thêm):
- PORT
- MONGO_URI, DB_USER, DB_PASS, DB_NAME
- JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET_KEY
- FIREBASE_TYPE, FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_CLIENT_ID, FIREBASE_AUTH_URI, FIREBASE_TOKEN_URI, FIREBASE_AUTH_PROVIDER_X509_CERT_URL, FIREBASE_CLIENT_X509_CERT_URL, FIREBASE_UNIVERSE_DOMAIN

Lưu ý: `FIREBASE_PRIVATE_KEY` cần thay \n bằng xuống dòng thực sự, code đã xử lý `replace(/\\n/g, '\n')`.

### Chạy dự án
```bash
npm install
npm run dev   # hoặc: npm start
```
Server mặc định chạy tại: http://localhost:5000

### Cấu trúc base path
- API gốc: `/api`
- AdminJS: cấu hình động theo `buildAdminRouter(app)` (truy cập qua `adminJs.options.rootPath`).

### Xác thực & phân quyền
- `Authorization: Bearer <access_token>` với các route yêu cầu bảo vệ (`protect`).
- Phân quyền qua `authorize('admin')`, `authorize('user')`,... tùy từng route.

---

## Danh sách API

Ở dưới là liệt kê endpoint theo nhóm và method. Base path được ghi trong tiêu đề nhóm.

### Auth - `/api/auth`
- POST `/register`
- POST `/login`
- POST `/logout`
- POST `/update-fcm-token` (yêu cầu token)
- POST `/forgot-password`
- POST `/verify-otp`
- GET `/profile` (yêu cầu token)

### Users - `/api/users`
- GET `/all` (admin)
- GET `/role` (admin)
- POST `/me/avatar` (user)
- PATCH `/password` (user)
- GET `/me/info` (user)
- GET `/:id` (user)
- PUT `/:id` (user)
- DELETE `/:id` (admin)

### Products - `/api/products`
- GET `/all`
- GET `/search`
- GET `/featured`
- GET `/sale`
- GET `/new`
- GET `/category/:id`
- POST `/create` (admin, upload field: `file`)
- PUT `/update/:id` (admin, upload field: `file`)
- DELETE `/delete/:id` (admin)
- GET `/:id/rating-stats`
- GET `/:id`

### Categories - `/api/categories`
- GET `/all`
- GET `/view/:id`
- POST `/create` (admin)
- PUT `/update/:id` (admin)
- DELETE `/delete/:id` (admin)

### Reviews - `/api/reviews`
- POST `/create` (user)
- GET `/product/:productId`
- GET `/user/:userId` (user)
- PUT `/update/:id` (user)
- DELETE `/delete/:id` (user)

### Addresses - `/api/addresses`
- GET `/province` (public)
- GET `/ward` (public)
- POST `/create` (user)
- GET `/my` (user)
- GET `/all` (user)
- GET `/:id` (user)
- PUT `/update/:id` (user)
- DELETE `/delete/:id` (user)

### Discount Coupons - `/api/discount-coupons`
- POST `/create` (admin)
- PUT `/update/:id` (admin)
- DELETE `/delete/:id` (admin)
- GET `/` (admin)
- GET `/:id` (admin)
- POST `/apply` (public)

### Cart - `/api/carts` (mọi route đều yêu cầu token của user)
- POST `/` (add to cart)
- GET `/user` (get cart)
- POST `/increase`
- POST `/decrease`
- DELETE `/remove`
- GET `/user/count`

### Orders - `/api/orders` (đã đặt `protect` toàn nhóm)
- POST `/` (user) – tạo đơn hàng
- GET `/my-orders` (user)
- GET `/view/:orderId` (user|admin)
- GET `/all` (admin)
- PUT `/update/:orderId` (admin)
- PATCH `/payment/:orderId` (user)
- DELETE `/cancel` (user|admin)

### Shipping - `/api/shipping`
- GET `/fee/:addressId` (user)
- POST `/fee/calculate` (user)
- GET `/address-info/:addressId` (user)
- GET `/centers` (public)

### Statistics - `/api/statistics` (toàn bộ yêu cầu admin)
- GET `/overview`
- GET `/revenue`
- GET `/top-selling-products`
- GET `/customers`
- GET `/categories`

### Banners - `/api/banners`
- POST `/create` (upload nhiều: field `banners`, tối đa 5)
- GET `/`

### Notifications - `/api/notifications`
- POST `/`
- GET `/`
- GET `/:id`
- PUT `/:id`
- DELETE `/:id`
- PUT `/mark-all-as-read`

---

## Ghi chú sử dụng
- Đính kèm header `Authorization` với token ở các route được đánh dấu (user/admin).
- Upload ảnh dùng `multipart/form-data` theo field đã ghi trong từng endpoint.
- AdminJS có sẵn cho quản trị cơ bản dữ liệu.

## Scripts hữu ích
```bash
npm run seed:users
npm run seed:reviews
npm run seed:all
```

## Healthcheck
- GET `/` → `{ success: true, message: "Server is running" }`


