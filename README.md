# 🍞 TuHuBread Server

Backend REST API cho ứng dụng bán bánh mì TuHuBread, xây dựng với Node.js/Express, MongoDB Atlas, và triển khai qua Docker.

**Điểm nhấn**
- Xác thực JWT với Access/Refresh token, phân quyền và quản lý session an toàn.
- Quản lý sản phẩm, giỏ hàng, đơn hàng, mã giảm giá, phí vận chuyển.
- Upload ảnh bằng Cloudinary, thông báo qua Firebase FCM và email.
- Bảo mật: rate limiting, security headers, input sanitization.

**Yêu cầu hệ thống**
- `Node.js` >= `22`
- `npm` >= `10`
- `MongoDB Atlas` (đã bật Network Access cho IP/cluster)

**Cài đặt nhanh**
- Clone: `git clone https://github.com/duongndev/ServerTuHu.git && cd ServerTuHu`
- Cài deps: `npm ci`
- Tạo env: `cp .env.example .env` và điền các biến chính:
  - `MONGO_ATLAS_URI`, `MONGO_ATLAS_DB`, `MONGO_ATLAS_USER`, `MONGO_ATLAS_PASS`
  - `JWT_SECRET`, `SESSION_SECRET`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `FIREBASE_*` nếu dùng FCM
- Chạy dev: `npm run dev` (http://localhost:5000)

**Docker**
- Build: `docker build -t duongnd202/tuhu-bread:latest .`
- Run: `docker run --env-file .env -p 5000:5000 duongnd202/tuhu-bread:latest`
- Healthcheck: `GET /health` trong container phải trả 200.

**Docker Compose (Atlas)**
- File `docker-compose.yml` sử dụng service `app`:
  - `env_file: .env` (đọc Atlas URI và các secrets)
  - `ports: "5000:5000"`, `restart: always`
- Chạy: `docker-compose up --build -d`

**CI/CD (GitHub Actions → Docker Hub)**
- Workflow `ci-cd.yml`:
  - Thiết lập `Node.js 22` cho job test.
  - Build và push image bằng Docker Buildx.
- Secrets cần thiết trên repository:
  - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
  - `MONGO_ATLAS_URI`, `MONGO_ATLAS_DB`, `MONGO_ATLAS_USER`, `MONGO_ATLAS_PASS`
- Tag image:
  - `duongnd202/tuhu-bread:latest`
  - `duongnd202/tuhu-bread:<GIT_SHA>`

**Cấu trúc dự án**
- `server.js` – entry point Express
- `src/config` – cấu hình DB/Cloudinary/Firebase
- `src/middlewares` – middleware bảo mật, validation, session
- `src/models` – schema Mongoose
- `src/routes` – định nghĩa API routes
- `src/controllers` – business logic
- `src/service` – email, notification
- `src/utils` – tiện ích tính phí, validate
- `src/view` – template email/OTP

**Endpoints quan trọng**
- `GET /health` – kiểm tra tình trạng server (dùng cho Docker HEALTHCHECK)

**Ghi chú bảo mật & vận hành**
- Atlas yêu cầu TLS/SSL khi `NODE_ENV=production`.
- Bật IP Allowlist hoặc dùng `0.0.0.0/0` tạm thời để test.
- Không commit `.env`; dùng `.env.example` để tham khảo cấu hình.

**Khắc phục sự cố**
- Lỗi `jsdom`/`webidl-conversions`: đảm bảo `Node >= 20`; dự án dùng `Node 22`.
- Cảnh báo CRLF/LF trên Windows: đã cấu hình `.gitattributes` để chuẩn hóa line endings.
- Kết nối Atlas thất bại: kiểm tra `MONGO_ATLAS_URI` đúng format (có `user:pass@`) hoặc set `MONGO_ATLAS_USER/PASS` riêng; đảm bảo network access đúng.

**Giấy phép**
- Nội bộ dự án; không kèm license công khai.