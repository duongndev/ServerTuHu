# 📋 TuHuBread Server - Chức Năng Theo Quy Trình Business

## Tổng quan
Dự án TuHuBread Server cung cấp 16 module chính với hơn 80 API endpoints, hỗ trợ 2 vai trò chính: **User** và **Admin**.

---

## 1. Quy trình Xác thực & Quản lý Tài khoản

### Chức năng chính:
- **Đăng ký tài khoản mới** - Tạo tài khoản user với email, password, thông tin cá nhân
- **Đăng nhập hệ thống** - Xác thực với email/password, trả về JWT tokens
- **Đăng xuất** - Đăng xuất và blacklist token
- **Làm mới token (refresh token)** - Cấp access token mới từ refresh token
- **Đổi mật khẩu** - Thay đổi mật khẩu khi đã đăng nhập
- **Quên mật khẩu** - Gửi OTP qua email để đặt lại mật khẩu
- **Xác thực OTP** - Xác thực mã OTP nhận qua email
- **Đặt lại mật khẩu** - Đặt lại mật khẩu mới với OTP đã xác thực
- **Cập nhật FCM token** - Cập nhật token để nhận thông báo đẩy
- **Xem thông tin profile** - Lấy thông tin cá nhân user hiện tại
- **Cập nhật avatar** - Thay đổi ảnh đại diện
- **Quản lý user** (Admin) - Xem, cập nhật, xóa tài khoản user

### API Endpoints:
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/refresh-token` - Làm mới token
- `POST /api/auth/change-password` - Đổi mật khẩu
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/verify-otp` - Xác thực OTP
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `POST /api/auth/update-fcm-token` - Cập nhật FCM token
- `GET /api/auth/me` - Xem profile
- `PUT /api/users/me/avatar` - Cập nhật avatar
- `GET /api/users/all` - Xem tất cả users (Admin)
- `GET /api/users/:id` - Xem user theo ID (Admin)
- `PUT /api/users/update/:id` - Cập nhật user (Admin)
- `DELETE /api/users/delete/:id` - Xóa user (Admin)

---

## 2. Quy trình Quản lý Sản phẩm & Danh mục

### Chức năng chính:
- **Quản lý danh mục sản phẩm** (Admin)
  - Tạo danh mục mới
  - Cập nhật thông tin danh mục
  - Xóa danh mục
  - Xem tất cả danh mục
  - Xem chi tiết danh mục

- **Quản lý sản phẩm** (Admin)
  - Tạo sản phẩm mới (có upload ảnh)
  - Cập nhật sản phẩm
  - Xóa sản phẩm
  - Xem tất cả sản phẩm (có phân trang, lọc, sắp xếp)
  - Xem chi tiết sản phẩm

- **Khám phá sản phẩm** (User)
  - Tìm kiếm sản phẩm theo tên
  - Xem sản phẩm nổi bật
  - Xem sản phẩm giảm giá
  - Xem sản phẩm mới
  - Xem sản phẩm theo danh mục
  - Xem thống kê đánh giá sản phẩm

### API Endpoints:
#### Categories:
- `GET /api/categories` - Xem tất cả danh mục
- `GET /api/categories/all` - Xem tất cả danh mục
- `GET /api/categories/view/:id` - Xem danh mục theo ID
- `POST /api/categories/create` - Tạo danh mục (Admin)
- `PUT /api/categories/update/:id` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/delete/:id` - Xóa danh mục (Admin)

#### Products:
- `GET /api/products` - Xem tất cả sản phẩm (có phân trang, lọc)
- `GET /api/products/search` - Tìm kiếm sản phẩm
- `GET /api/products/featured` - Xem sản phẩm nổi bật
- `GET /api/products/sale` - Xem sản phẩm giảm giá
- `GET /api/products/new` - Xem sản phẩm mới
- `GET /api/products/category/:id` - Xem sản phẩm theo danh mục
- `GET /api/products/:id` - Xem chi tiết sản phẩm
- `GET /api/products/:id/rating-stats` - Xem thống kê đánh giá
- `POST /api/products/create` - Tạo sản phẩm (Admin)
- `PUT /api/products/update/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/delete/:id` - Xóa sản phẩm (Admin)

---

## 3. Quy trình Giỏ hàng

### Chức năng chính:
- **Thêm sản phẩm vào giỏ hàng** - Thêm sản phẩm với số lượng
- **Xem giỏ hàng** - Xem tất cả sản phẩm trong giỏ
- **Tăng số lượng sản phẩm** - Tăng số lượng của sản phẩm trong giỏ
- **Giảm số lượng sản phẩm** - Giảm số lượng của sản phẩm trong giỏ
- **Xóa sản phẩm khỏi giỏ** - Loại bỏ sản phẩm khỏi giỏ hàng
- **Đếm số lượng sản phẩm** - Lấy tổng số lượng item trong giỏ

### API Endpoints:
- `POST /api/carts` - Thêm vào giỏ hàng
- `GET /api/carts/user` - Xem giỏ hàng
- `POST /api/carts/increase` - Tăng số lượng
- `POST /api/carts/decrease` - Giảm số lượng
- `DELETE /api/carts/remove` - Xóa khỏi giỏ
- `GET /api/carts/user/count` - Đếm số lượng

---

## 4. Quy trình Đặt hàng & Thanh toán

### Chức năng chính:
- **Tạo đơn hàng mới** - Tạo đơn từ giỏ hàng với địa chỉ và phương thức thanh toán
- **Xem danh sách đơn hàng** - Xem các đơn hàng của user hiện tại
- **Xem chi tiết đơn hàng** - Xem thông tin chi tiết một đơn hàng
- **Hủy đơn hàng** - Hủy đơn hàng (khi chưa giao)
- **Cập nhật trạng thái đơn hàng** (Admin) - Thay đổi trạng thái: pending → processing → shipped → delivered
- **Cập nhật trạng thái thanh toán** - Cập nhật khi thanh toán thành công/thất bại
- **Xem tất cả đơn hàng** (Admin) - Xem tất cả đơn hàng của hệ thống
- **Thanh toán qua ZaloPay** - Tích hợp thanh toán điện tử
- **Callback thanh toán** - Xử lý callback từ ZaloPay
- **Hoàn tiền** - Yêu cầu hoàn tiền qua ZaloPay
- **Kiểm tra trạng thái hoàn tiền** - Kiểm tra tiến trình hoàn tiền

### API Endpoints:
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders/my-orders` - Xem đơn hàng của user
- `GET /api/orders/:orderId` - Xem chi tiết đơn hàng
- `DELETE /api/orders/cancel` - Hủy đơn hàng
- `PUT /api/orders/:orderId/status` - Cập nhật trạng thái (Admin)
- `PATCH /api/orders/payment/:orderId` - Cập nhật trạng thái thanh toán
- `GET /api/orders/all` - Xem tất cả đơn hàng (Admin)
- `POST /api/zalopay/callback` - Callback ZaloPay
- `POST /api/zalopay/refund` - Hoàn tiền
- `GET /api/zalopay/refund/:refundId` - Kiểm tra hoàn tiền

---

## 5. Quy trình Đánh giá Sản phẩm

### Chức năng chính:
- **Tạo đánh giá sản phẩm** - Đánh giá sản phẩm đã mua (1-5 sao + comment)
- **Xem đánh giá theo sản phẩm** - Xem tất cả đánh giá của một sản phẩm
- **Xem đánh giá theo user** - Xem tất cả đánh giá của một user
- **Cập nhật đánh giá** - Chỉnh sửa đánh giá đã tạo
- **Xóa đánh giá** - Xóa đánh giá của chính mình

### API Endpoints:
- `POST /api/reviews/create` - Tạo đánh giá
- `GET /api/reviews/product/:productId` - Xem đánh giá theo sản phẩm
- `GET /api/reviews/user/:userId` - Xem đánh giá theo user
- `PUT /api/reviews/update/:id` - Cập nhật đánh giá
- `DELETE /api/reviews/delete/:id` - Xóa đánh giá

---

## 6. Quy trình Quản lý Địa chỉ & Vận chuyển

### Chức năng chính:
- **Lấy danh sách tỉnh/thành phố** - Lấy danh sách tỉnh thành Việt Nam
- **Lấy danh sách phường/xã** - Lấy danh sách phường xã theo quận/huyện
- **Tạo địa chỉ mới** - Lưu địa chỉ giao hàng
- **Xem địa chỉ của user** - Xem tất cả địa chỉ đã lưu
- **Xem tất cả địa chỉ** (Admin) - Xem tất cả địa chỉ hệ thống
- **Xem chi tiết địa chỉ** - Xem thông tin một địa chỉ
- **Cập nhật địa chỉ** - Chỉnh sửa thông tin địa chỉ
- **Xóa địa chỉ** - Xóa địa chỉ đã lưu
- **Tính phí vận chuyển** (từ địa chỉ đã lưu) - Tính phí dựa trên địa chỉ
- **Tính phí vận chuyển** (từ địa chỉ cụ thể) - Tính phí từ địa chỉ tùy chỉnh
- **Xem thông tin địa chỉ vận chuyển** - Lấy chi tiết địa chỉ
- **Xem danh sách trung tâm giao hàng** - Xem các trung tâm giao hàng Hà Nội

### API Endpoints:
- `GET /api/addresses/province` - Lấy danh sách tỉnh
- `GET /api/addresses/ward` - Lấy danh sách phường/xã
- `POST /api/addresses/create` - Tạo địa chỉ
- `GET /api/addresses/my` - Xem địa chỉ của user
- `GET /api/addresses/all` - Xem tất cả địa chỉ (Admin)
- `GET /api/addresses/:id` - Xem địa chỉ theo ID
- `PUT /api/addresses/update/:id` - Cập nhật địa chỉ
- `DELETE /api/addresses/delete/:id` - Xóa địa chỉ
- `GET /api/shipping/fee/:addressId` - Tính phí vận chuyển (địa chỉ đã lưu)
- `POST /api/shipping/fee/calculate` - Tính phí vận chuyển (địa chỉ tùy chỉnh)
- `GET /api/shipping/address-info/:addressId` - Xem thông tin địa chỉ
- `GET /api/shipping/centers` - Xem trung tâm giao hàng

---

## 7. Quy trình Mã Giảm giá

### Chức năng chính:
- **Tạo mã giảm giá** (Admin) - Tạo mã giảm giá mới với điều kiện áp dụng
- **Cập nhật mã giảm giá** (Admin) - Chỉnh sửa thông tin mã giảm giá
- **Xóa mã giảm giá** (Admin) - Xóa mã giảm giá
- **Xem tất cả mã giảm giá** (Admin) - Xem danh sách mã giảm giá
- **Xem chi tiết mã giảm giá** (Admin) - Xem thông tin một mã giảm giá
- **Áp dụng mã giảm giá** - Kiểm tra và áp dụng mã giảm giá khi đặt hàng

### API Endpoints:
- `POST /api/discount-coupons/create` - Tạo mã giảm giá (Admin)
- `PUT /api/discount-coupons/update/:id` - Cập nhật mã giảm giá (Admin)
- `DELETE /api/discount-coupons/delete/:id` - Xóa mã giảm giá (Admin)
- `GET /api/discount-coupons` - Xem tất cả mã giảm giá (Admin)
- `GET /api/discount-coupons/:id` - Xem mã giảm giá theo ID (Admin)
- `POST /api/discount-coupons/apply` - Áp dụng mã giảm giá

---

## 8. Quy trình Thông báo

### Chức năng chính:
- **Tạo thông báo mới** - Tạo thông báo hệ thống
- **Xem tất cả thông báo** - Xem danh sách thông báo (có phân trang, lọc)
- **Xem chi tiết thông báo** - Xem nội dung một thông báo
- **Cập nhật thông báo** - Chỉnh sửa thông báo
- **Xóa thông báo** - Xóa thông báo
- **Đánh dấu tất cả là đã đọc** - Đánh dấu tất cả thông báo đã đọc

### API Endpoints:
- `POST /api/notifications` - Tạo thông báo
- `GET /api/notifications` - Xem tất cả thông báo
- `GET /api/notifications/:id` - Xem thông báo theo ID
- `PUT /api/notifications/:id` - Cập nhật thông báo
- `DELETE /api/notifications/:id` - Xóa thông báo
- `PUT /api/notifications/mark-all-as-read` - Đánh dấu tất cả đã đọc

---

## 9. Quy trình Thống kê & Dashboard (Admin)

### Chức năng chính:
- **Thống kê tổng quan** - Tổng quan doanh thu, đơn hàng, user, sản phẩm
- **Thống kê doanh thu** - Doanh thu theo năm, tháng, tuần
- **Thống kê sản phẩm bán chạy** - Top sản phẩm bán chạy nhất
- **Thống kê khách hàng** - Thống kê về user đăng ký, hoạt động
- **Thống kê theo danh mục** - Doanh thu, số lượng theo từng danh mục
- **Dashboard overview** - Tổng quan dashboard
- **Dashboard doanh thu** - Biểu đồ doanh thu
- **Dashboard sản phẩm top** - Top sản phẩm
- **Dashboard người dùng** - Thống kê user
- **Dashboard đánh giá** - Thống kê đánh giá
- **Dashboard mã giảm giá** - Thống kê mã giảm giá
- **Dashboard danh mục** - Thống kê danh mục

### API Endpoints:
#### Statistics:
- `GET /api/statistics/overview` - Thống kê tổng quan
- `GET /api/statistics/revenue` - Thống kê doanh thu
- `GET /api/statistics/top-selling-products` - Sản phẩm bán chạy
- `GET /api/statistics/customers` - Thống kê khách hàng
- `GET /api/statistics/categories` - Thống kê danh mục

#### Dashboard:
- `GET /api/dashboard/overview` - Dashboard tổng quan
- `GET /api/dashboard/revenue` - Dashboard doanh thu
- `GET /api/dashboard/products/top` - Dashboard sản phẩm top
- `GET /api/dashboard/users` - Dashboard người dùng
- `GET /api/dashboard/reviews` - Dashboard đánh giá
- `GET /api/dashboard/coupons` - Dashboard mã giảm giá
- `GET /api/dashboard/categories` - Dashboard danh mục

---

## 10. Quy trình Quản lý Banner

### Chức năng chính:
- **Tạo banner mới** - Upload và tạo banner quảng cáo
- **Xem tất cả banner** - Xem danh sách banner hiển thị

### API Endpoints:
- `POST /api/banners` - Tạo banner
- `GET /api/banners` - Xem tất cả banner

---

## 11. Quy trình Health Check (Hệ thống)

### Chức năng chính:
- **Kiểm tra sức khỏe hệ thống** - Kiểm tra status server, database, memory
- **Liveness probe** - Kiểm tra server còn hoạt động
- **Readiness probe** - Kiểm tra hệ thống sẵn sàng phục vụ

### API Endpoints:
- `GET /health` - Health check chi tiết
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

---

## Tóm tắt Luồng chính

### User Flow:
1. **Đăng ký/Đăng nhập** → Quản lý profile
2. **Xem sản phẩm** → Thêm vào giỏ hàng → Đặt hàng → Thanh toán
3. **Quản lý địa chỉ** → Tính phí vận chuyển
4. **Đánh giá sản phẩm** sau khi mua
5. **Sử dụng mã giảm giá** khi đặt hàng
6. **Nhận thông báo** về đơn hàng

### Admin Flow:
1. **Quản lý danh mục & sản phẩm** - CRUD
2. **Quản lý đơn hàng & thanh toán** - Xử lý đơn hàng
3. **Quản lý user** - Quản lý tài khoản
4. **Quản lý mã giảm giá** - Tạo và quản lý mã
5. **Quản lý banner** - Upload banner
6. **Xem thống kê & dashboard** - Phân tích dữ liệu
7. **Tạo thông báo** - Gửi thông báo đến user

---

## Thông tin kỹ thuật

### Base URL:
```
http://localhost:5001/api
```

### Authentication:
- **JWT Authentication**: Access Token + Refresh Token pattern
- **Token Format**: `Bearer <token>`
- **Rate Limiting**: 5 requests per 15 minutes cho auth endpoints

### Roles:
- **User**: Khách hàng mua hàng
- **Admin**: Quản trị viên hệ thống

### Integrations:
- **ZaloPay**: Thanh toán điện tử
- **Cloudinary**: Lưu trữ ảnh
- **FCM**: Thông báo đẩy
- **MongoDB**: Database

### Security Features:
- Rate limiting & DDoS protection
- Input validation & sanitization
- SQL/NoSQL injection prevention
- Secure file upload
- Token blacklisting
