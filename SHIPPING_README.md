# Chức Năng Tính Phí Vận Chuyển - OpenStreetMap

## Tổng Quan

Chức năng tính phí vận chuyển đã được viết lại để sử dụng OpenStreetMap thông qua Nominatim API (miễn phí) thay vì Google Maps API. Hệ thống tính toán dựa trên khoảng cách thực tế giữa địa chỉ giao hàng và trung tâm gần nhất của Hà Nội.

## Tính Năng Chính

### 1. Tính Phí Vận Chuyển Tự Động
- Sử dụng OpenStreetMap để lấy tọa độ chính xác của địa chỉ
- Tính khoảng cách thực tế sử dụng công thức Haversine
- Phân loại khu vực dựa trên khoảng cách thực tế
- Tính phí vận chuyển và thời gian giao hàng tự động

### 2. Hỗ Trợ 12 Trung Tâm Hà Nội
- Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng
- Thanh Xuân, Cầu Giấy, Nam Từ Liêm, Tây Hồ
- Hà Đông, Hoàng Mai, Long Biên, Bắc Từ Liêm

### 3. Phân Loại Khu Vực Theo Khoảng Cách
- **≤5km**: Nội thành gần - 15,000đ (15-30 phút)
- **5-10km**: Nội thành trung bình - 20,000đ (30-45 phút)
- **10-20km**: Nội thành xa - 30,000đ (45-60 phút)
- **20-30km**: Ngoại thành gần - 40,000đ (60-90 phút)
- **>30km**: Ngoại thành xa - 50,000đ (90-120 phút)

## API Endpoints

### 1. Tính Phí Vận Chuyển Từ Địa Chỉ Đã Lưu
```
GET /api/shipping/fee/:addressId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Tính phí vận chuyển thành công",
  "data": {
    "delivery_fee": 20000,
    "estimated_time": "30-45 phút",
    "address_info": {
      "full_address": "123 Đường ABC, Phường XYZ, Quận 123, Hà Nội, Việt Nam",
      "coordinates": {
        "latitude": 21.0285,
        "longitude": 105.8542
      },
      "nearest_center": {
        "name": "Hoàn Kiếm",
        "coordinates": {
          "latitude": 21.0285,
          "longitude": 105.8542
        },
        "distance_from_center": 0.5
      },
      "distance_from_center": 7.2,
      "zone": "Nội thành trung bình"
    },
    "distance_km": 7.2,
    "zone": "Nội thành trung bình"
  }
}
```

### 2. Tính Phí Vận Chuyển Từ Địa Chỉ Cụ Thể
```
POST /api/shipping/fee/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullAddress": "123 Đường ABC",
  "ward": "Phường XYZ",
  "district": "Quận 123",
  "province": "Hà Nội"
}
```

### 3. Lấy Thông Tin Chi Tiết Địa Chỉ
```
GET /api/shipping/address-info/:addressId
Authorization: Bearer <token>
```

### 4. Lấy Danh Sách Trung Tâm Hà Nội
```
GET /api/shipping/centers
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách trung tâm Hà Nội thành công",
  "data": {
    "centers": [
      {
        "name": "Hoàn Kiếm",
        "coordinates": {
          "latitude": 21.0285,
          "longitude": 105.8542
        }
      }
    ],
    "total": 12
  }
}
```

## Cách Hoạt Động

### 1. Geocoding
- Sử dụng Nominatim API (OpenStreetMap) để chuyển đổi địa chỉ thành tọa độ
- Chỉ tìm kiếm trong phạm vi Việt Nam (`countrycodes: 'vn'`)
- Yêu cầu User-Agent header theo quy định của Nominatim

### 2. Tính Khoảng Cách
- Sử dụng công thức Haversine để tính khoảng cách giữa hai điểm
- Độ chính xác cao cho khoảng cách ngắn (< 1000km)
- Kết quả trả về đơn vị km

### 3. Tìm Trung Tâm Gần Nhất
- So sánh khoảng cách đến tất cả 12 trung tâm Hà Nội
- Chọn trung tâm có khoảng cách ngắn nhất
- Tính phí vận chuyển dựa trên khoảng cách này

## Lợi Ích So Với Hệ Thống Cũ

### 1. Độ Chính Xác Cao Hơn
- Tính khoảng cách thực tế thay vì phân loại theo zone cố định
- Sử dụng tọa độ GPS chính xác từ OpenStreetMap
- Phân loại khu vực linh hoạt theo khoảng cách

### 2. Tiết Kiệm Chi Phí
- Sử dụng OpenStreetMap miễn phí thay vì Google Maps API
- Không có giới hạn số lượng request
- Không cần API key

### 3. Tính Năng Mở Rộng
- Dễ dàng thêm trung tâm mới
- Có thể điều chỉnh bảng giá theo khoảng cách
- Hỗ trợ nhiều tỉnh thành khác trong tương lai

## Cài Đặt Và Sử Dụng

### 1. Dependencies
```bash
npm install axios
```

### 2. Cấu Hình
- Không cần API key
- Chỉ cần đảm bảo có kết nối internet để gọi Nominatim API
- User-Agent được cấu hình sẵn: `TuHuBreadServer/1.0`

### 3. Rate Limiting
- Nominatim có giới hạn 1 request/giây
- Hệ thống xử lý lỗi gracefully khi API không khả dụng
- Có thể thêm cache để giảm số lượng request

## Xử Lý Lỗi

### 1. Geocoding Fail
- Trả về lỗi 400 nếu không thể xác định tọa độ
- Log lỗi để debug
- Có thể fallback về hệ thống cũ nếu cần

### 2. API Unavailable
- Xử lý timeout và network errors
- Trả về lỗi 500 với message rõ ràng
- Không làm crash hệ thống

### 3. Invalid Address
- Validate địa chỉ trước khi geocode
- Chỉ hỗ trợ địa chỉ ở Hà Nội
- Kiểm tra quyền truy cập địa chỉ


## Tương Lai

### 1. Mở Rộng Địa Bàn
- Hỗ trợ các tỉnh thành khác
- Thêm trung tâm mới cho từng tỉnh
- Tính phí vận chuyển liên tỉnh

### 2. Tối Ưu Hóa
- Cache kết quả geocoding
- Batch processing cho nhiều địa chỉ
- Offline mode với dữ liệu đã cache

### 3. Tích Hợp
- Tích hợp với bản đồ để hiển thị trực quan
- Tính toán tuyến đường tối ưu
- Dự đoán thời gian giao hàng chính xác hơn
