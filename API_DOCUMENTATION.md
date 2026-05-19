# 📚 TuHuBread Server API Documentation

## 🌐 Base URL
```
http://localhost:5001/api
```

## 🔐 Authentication

### Overview
- **JWT Authentication**: Access Token + Refresh Token pattern
- **Token Format**: `Bearer <token>`
- **Rate Limiting**: 5 requests per 15 minutes for auth endpoints

---

## 👤 Authentication APIs

### 1. Register User
**POST** `/api/auth/register`

**Description**: Register a new user account

**Request Body**:
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string (min 6 characters)",
  "phoneNumber": "string (optional, 10-11 digits)"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "role": "user",
      "avatar": "string",
      "status": "inactive"
    },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

---

### 2. Login
**POST** `/api/auth/login`

**Description**: Login with email and password

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "role": "user",
      "avatar": "string"
    },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

---

### 3. Logout
**POST** `/api/auth/logout`

**Description**: Logout current user (blacklist token)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Authentication**: Required

---

### 4. Refresh Token
**POST** `/api/auth/refresh-token`

**Description**: Get new access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

---

### 5. Get Profile
**GET** `/api/auth/me`

**Description**: Get current user profile

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "string",
    "fullName": "string",
    "email": "string",
    "role": "user",
    "avatar": "string",
    "phoneNumber": "string",
    "emailVerified": true,
    "status": "active"
  }
}
```

**Authentication**: Required

---

### 6. Change Password
**POST** `/api/auth/change-password`

**Description**: Change user password

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 6 characters)"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Authentication**: Required  
**Rate Limit**: 3 requests per hour

---

### 7. Forgot Password
**POST** `/api/auth/forgot-password`

**Description**: Request password reset OTP via email

**Request Body**:
```json
{
  "email": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP sent to email"
}
```

**Rate Limit**: 3 requests per hour

---

### 8. Verify OTP
**POST** `/api/auth/verify-otp`

**Description**: Verify OTP for password reset

**Request Body**:
```json
{
  "email": "string",
  "otp": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### 9. Reset Password
**POST** `/api/auth/reset-password`

**Description**: Reset password with verified OTP

**Request Body**:
```json
{
  "email": "string",
  "otp": "string",
  "newPassword": "string (min 6 characters)"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Rate Limit**: 3 requests per hour

---

### 10. Update FCM Token
**POST** `/api/auth/update-fcm-token`

**Description**: Update Firebase Cloud Messaging token for push notifications

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "fcmToken": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "FCM token updated successfully"
}
```

**Authentication**: Required

---

## 🥖 Product APIs

### 1. Get All Products
**GET** `/api/products`

**Description**: Get all products with pagination, filtering, and sorting

**Query Parameters**:
```
page: number (default: 1)
limit: number (default: 10)
search: string (search in name, description, tags)
category: string (category ID)
minPrice: number
maxPrice: number
sort: string (price, rating, name, newest)
isFeatured: boolean
isOnSale: boolean
isAvailable: boolean
```

**Response** (200):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "string",
        "name": "string",
        "description": "string",
        "imgUrl": "string",
        "price": number,
        "discountPrice": number,
        "category_id": "string",
        "isOnSale": boolean,
        "isAvailable": boolean,
        "averageRating": number,
        "totalReviews": number,
        "isFeatured": boolean
      }
    ],
    "pagination": {
      "currentPage": number,
      "totalPages": number,
      "totalProducts": number,
      "hasNext": boolean,
      "hasPrev": boolean
    }
  }
}
```

---

### 2. Get Product by ID
**GET** `/api/products/:id`

**Description**: Get detailed product information

**Response** (200):
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "imgUrl": "string",
    "price": number,
    "discountPrice": number,
    "category_id": "string",
    "ingredients": ["string"],
    "allergens": ["string"],
    "nutritionInfo": {
      "calories": number,
      "protein": number,
      "fat": number,
      "carbs": number,
      "fiber": number,
      "sodium": number
    },
    "weight": number,
    "size": "S|M|L",
    "shelfLife": number,
    "storageCondition": "string",
    "isOnSale": boolean,
    "isAvailable": boolean,
    "averageRating": number,
    "totalReviews": number,
    "isFeatured": boolean,
    "slug": "string",
    "tags": ["string"]
  }
}
```

---

### 3. Search Products
**GET** `/api/products/search`

**Query Parameters**:
```
q: string (search query)
```

**Response** (200):
```json
{
  "success": true,
  "message": "Search results",
  "data": {
    "products": [...]
  }
}
```

---

### 4. Get Featured Products
**GET** `/api/products/featured`

**Description**: Get all featured products

**Response** (200):
```json
{
  "success": true,
  "message": "Featured products retrieved",
  "data": {
    "products": [...]
  }
}
```

---

### 5. Get Sale Products
**GET** `/api/products/sale`

**Description**: Get all products on sale

**Response** (200):
```json
{
  "success": true,
  "message": "Sale products retrieved",
  "data": {
    "products": [...]
  }
}
```

---

### 6. Get New Products
**GET** `/api/products/new`

**Description**: Get newest products

**Response** (200):
```json
{
  "success": true,
  "message": "New products retrieved",
  "data": {
    "products": [...]
  }
}
```

---

### 7. Get Products by Category
**GET** `/api/products/category/:id`

**Query Parameters**:
```
page: number (default: 1)
limit: number (default: 10)
```

**Response** (200):
```json
{
  "success": true,
  "message": "Category products retrieved",
  "data": {
    "products": [...],
    "pagination": {...}
  }
}
```

---

### 8. Create Product (Admin)
**POST** `/api/products/create`

**Description**: Create a new product (Admin only)

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
```
file: image file
name: string
description: string
price: number
category_id: string
ingredients: string (JSON array)
allergens: string (JSON array)
nutritionInfo: string (JSON object)
weight: number
size: S|M|L
shelfLife: number
storageCondition: string
discountPrice: number (optional)
tags: string (JSON array)
slug: string (optional)
```

**Response** (201):
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "string",
    "name": "string",
    ...
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 9. Update Product (Admin)
**PUT** `/api/products/update/:id`

**Description**: Update product information (Admin only)

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body**: Same as create product

**Response** (200):
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 10. Delete Product (Admin)
**DELETE** `/api/products/delete/:id`

**Description**: Delete a product (Admin only)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 11. Get Product Rating Stats
**GET** `/api/products/:id/rating-stats`

**Description**: Get rating statistics for a product

**Response** (200):
```json
{
  "success": true,
  "message": "Rating stats retrieved",
  "data": {
    "averageRating": number,
    "totalReviews": number,
    "ratingDistribution": {
      "5": number,
      "4": number,
      "3": number,
      "2": number,
      "1": number
    }
  }
}
```

---

## 🛒 Cart APIs

### 1. Add to Cart
**POST** `/api/carts`

**Description**: Add product to cart

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "product_id": "string",
  "quantity": number
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Product added to cart",
  "data": {
    "items": [...],
    "totalItems": number,
    "totalPrice": number
  }
}
```

**Authentication**: Required  
**Authorization**: User only

---

### 2. Get User Cart
**GET** `/api/carts/user`

**Description**: Get current user's cart

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Cart retrieved",
  "data": {
    "items": [
      {
        "product_id": "string",
        "product_name": "string",
        "product_image": "string",
        "product_price": number,
        "product_discount_price": number,
        "product_actual_price": number,
        "isOnSale": boolean,
        "product_quantity": number
      }
    ],
    "totalItems": number,
    "totalPrice": number
  }
}
```

**Authentication**: Required  
**Authorization**: User only

---

### 3. Increase Quantity
**POST** `/api/carts/increase`

**Description**: Increase product quantity in cart

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "product_id": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Quantity increased",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: User only

---

### 4. Decrease Quantity
**POST** `/api/carts/decrease`

**Description**: Decrease product quantity in cart

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "product_id": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Quantity decreased",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: User only

---

### 5. Remove from Cart
**DELETE** `/api/carts/remove`

**Description**: Remove product from cart

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "product_id": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Product removed from cart",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: User only

---

### 6. Get Cart Item Count
**GET** `/api/carts/user/count`

**Description**: Get total number of items in cart

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Cart count retrieved",
  "data": {
    "count": number
  }
}
```

**Authentication**: Required  
**Authorization**: User only

---

## 💳 Order APIs

### 1. Create Order
**POST** `/api/orders`

**Description**: Create a new order

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "items": [
    {
      "product_id": "string",
      "name": "string",
      "price": number,
      "quantity": number
    }
  ],
  "shipping_address": {
    "fullName": "string",
    "phoneNumber": "string",
    "province": "string",
    "district": "string",
    "ward": "string",
    "streetAddress": "string"
  },
  "payment_method": "cash|zalopay|momo|vnpay",
  "coupon_code": "string (optional)",
  "notes": "string (optional)",
  "delivery_fee": number,
  "redirect_url": "string (optional for ZaloPay deep link)"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "string",
    "user_id": "string",
    "items": [...],
    "shipping_address": {...},
    "payment_method": "string",
    "total_price": number,
    "status": "pending",
    "payment_status": "unpaid",
    "zaloPayUrl": "string (if ZaloPay payment)"
  }
}
```

**Authentication**: Required  
**Authorization**: User only  
**Rate Limit**: 10 requests per 15 minutes

---

### 2. Get My Orders
**GET** `/api/orders/my-orders`

**Description**: Get current user's orders

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
status: string (pending, processing, shipped, delivered, cancelled)
page: number
limit: number
```

**Response** (200):
```json
{
  "success": true,
  "message": "Orders retrieved",
  "data": {
    "orders": [...],
    "pagination": {...}
  }
}
```

**Authentication**: Required  
**Authorization**: User only

---

### 3. Get All Orders (Admin)
**GET** `/api/orders/all`

**Description**: Get all orders (Admin only)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
status: string
page: number
limit: number
```

**Response** (200):
```json
{
  "success": true,
  "message": "All orders retrieved",
  "data": {
    "orders": [...],
    "pagination": {...}
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 4. Get Order by ID
**GET** `/api/orders/:orderId`

**Description**: Get order details

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Order retrieved",
  "data": {
    "_id": "string",
    "user_id": {...},
    "items": [...],
    "shipping_address": {...},
    "payment_method": "string",
    "total_price": number,
    "status": "string",
    "payment_status": "string",
    "created_at": "date"
  }
}
```

**Authentication**: Required  
**Authorization**: User or Admin

---

### 5. Update Order Status (Admin)
**PUT** `/api/orders/:orderId/status`

**Description**: Update order status (Admin only)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "status": "processing|shipped|delivered|cancelled"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 6. Update Payment Status
**PATCH** `/api/orders/payment/:orderId`

**Description**: Update payment status

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "payment_status": "paid|failed"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Payment status updated",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: User only

---

### 7. Cancel Order
**DELETE** `/api/orders/cancel`

**Description**: Cancel an order

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "orderId": "string",
  "reason": "string (optional)"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: User or Admin

---

## 💰 ZaloPay APIs

### 1. Payment Callback
**POST** `/api/zalopay/callback`

**Description**: Handle ZaloPay payment callback

**Request Body**:
```json
{
  "data": "string (encrypted data)",
  "mac": "string (signature)"
}
```

**Response** (200):
```json
{
  "return_code": 1,
  "return_message": "success"
}
```

**Note**: This endpoint is called by ZaloPay server, not by client

---

### 2. Refund Payment
**POST** `/api/zalopay/refund`

**Description**: Request refund for ZaloPay payment

**Request Body**:
```json
{
  "orderId": "string",
  "description": "string (optional)"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "return_code": 1,
    "return_message": "success",
    "m_refund_id": "string"
  }
}
```

---

### 3. Check Refund Status
**GET** `/api/zalopay/refund/:refundId`

**Description**: Check refund status

**Response** (200):
```json
{
  "return_code": 1,
  "return_message": "success",
  "refund_status": "string"
}
```

---

## ⭐ Review APIs

### 1. Create Review
**POST** `/api/reviews/create`

**Description**: Create a product review

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "product_id": "string",
  "rating": number (1-5),
  "comment": "string"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "_id": "string",
    "user_id": "string",
    "product_id": "string",
    "rating": number,
    "comment": "string",
    "created_at": "date"
  }
}
```

**Authentication**: Required

---

### 2. Get Reviews by Product
**GET** `/api/reviews/product/:productId`

**Query Parameters**:
```
page: number
limit: number
```

**Response** (200):
```json
{
  "success": true,
  "message": "Reviews retrieved",
  "data": {
    "reviews": [...],
    "pagination": {...}
  }
}
```

---

### 3. Get Reviews by User
**GET** `/api/reviews/user/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "User reviews retrieved",
  "data": {
    "reviews": [...]
  }
}
```

**Authentication**: Required

---

### 4. Update Review
**PUT** `/api/reviews/update/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "rating": number,
  "comment": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Review updated",
  "data": {...}
}
```

**Authentication**: Required

---

### 5. Delete Review
**DELETE** `/api/reviews/delete/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Review deleted"
}
```

**Authentication**: Required

---

## 📁 Category APIs

### 1. Get All Categories
**GET** `/api/categories`

**Response** (200):
```json
{
  "success": true,
  "message": "Categories retrieved",
  "data": {
    "categories": [
      {
        "_id": "string",
        "name": "string",
        "slug": "string",
        "description": "string",
        "imgUrl": "string",
        "isActive": boolean,
        "displayOrder": number
      }
    ]
  }
}
```

---

### 2. Get Category by ID
**GET** `/api/categories/view/:id`

**Response** (200):
```json
{
  "success": true,
  "message": "Category retrieved",
  "data": {...}
}
```

---

### 3. Create Category (Admin)
**POST** `/api/categories/create`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "imgUrl": "string (optional)"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Category created",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 4. Update Category (Admin)
**PUT** `/api/categories/update/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "imgUrl": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Category updated",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 5. Delete Category (Admin)
**DELETE** `/api/categories/delete/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Category deleted"
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

## 📍 Address APIs

### 1. Get Provinces
**GET** `/api/addresses/province`

**Response** (200):
```json
{
  "success": true,
  "message": "Provinces retrieved",
  "data": {
    "provinces": [...]
  }
}
```

---

### 2. Get Wards
**GET** `/api/addresses/ward`

**Query Parameters**:
```
districtId: string
```

**Response** (200):
```json
{
  "success": true,
  "message": "Wards retrieved",
  "data": {
    "wards": [...]
  }
}
```

---

### 3. Create Address
**POST** `/api/addresses/create`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "fullName": "string",
  "phoneNumber": "string",
  "province": "string",
  "district": "string",
  "ward": "string",
  "streetAddress": "string",
  "isDefault": boolean
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Address created",
  "data": {...}
}
```

**Authentication**: Required

---

### 4. Get My Addresses
**GET** `/api/addresses/my`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Addresses retrieved",
  "data": {
    "addresses": [...]
  }
}
```

**Authentication**: Required

---

### 5. Get All Addresses (Admin)
**GET** `/api/addresses/all`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "All addresses retrieved",
  "data": {
    "addresses": [...]
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 6. Get Address by ID
**GET** `/api/addresses/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Address retrieved",
  "data": {...}
}
```

**Authentication**: Required

---

### 7. Update Address
**PUT** `/api/addresses/update/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**: Same as create address

**Response** (200):
```json
{
  "success": true,
  "message": "Address updated",
  "data": {...}
}
```

**Authentication**: Required

---

### 8. Delete Address
**DELETE** `/api/addresses/delete/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Address deleted"
}
```

**Authentication**: Required

---

## 🚚 Shipping APIs

### 1. Calculate Shipping Fee (Saved Address)
**GET** `/api/shipping/fee/:addressId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Shipping fee calculated",
  "data": {
    "fee": number,
    "distance": number,
    "estimatedTime": string
  }
}
```

**Authentication**: Required

---

### 2. Calculate Shipping Fee (Custom Address)
**POST** `/api/shipping/fee/calculate`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "province": "string",
  "district": "string",
  "ward": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Shipping fee calculated",
  "data": {
    "fee": number,
    "distance": number,
    "estimatedTime": string
  }
}
```

**Authentication**: Required

---

### 3. Get Address Info
**GET** `/api/shipping/address-info/:addressId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Address info retrieved",
  "data": {...}
}
```

**Authentication**: Required

---

### 4. Get Hanoi Centers
**GET** `/api/shipping/centers`

**Response** (200):
```json
{
  "success": true,
  "message": "Hanoi centers retrieved",
  "data": {
    "centers": [...]
  }
}
```

---

## 🎟️ Discount Coupon APIs

### 1. Create Coupon (Admin)
**POST** `/api/discount-coupons/create`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "code": "string",
  "discountType": "percentage|fixed_amount",
  "discountValue": number,
  "minimumOrderAmount": number,
  "usageLimit": number,
  "expirationDate": "date (ISO string)"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Coupon created",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 2. Update Coupon (Admin)
**PUT** `/api/discount-coupons/update/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**: Same as create coupon

**Response** (200):
```json
{
  "success": true,
  "message": "Coupon updated",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 3. Delete Coupon (Admin)
**DELETE** `/api/discount-coupons/delete/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Coupon deleted"
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 4. Get All Coupons (Admin)
**GET** `/api/discount-coupons`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Coupons retrieved",
  "data": {
    "coupons": [...]
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 5. Get Coupon by ID (Admin)
**GET** `/api/discount-coupons/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Coupon retrieved",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 6. Apply Coupon
**POST** `/api/discount-coupons/apply`

**Request Body**:
```json
{
  "code": "string",
  "orderTotal": number
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Coupon applied",
  "data": {
    "discountAmount": number,
    "finalAmount": number,
    "couponInfo": {...}
  }
}
```

---

## 🔔 Notification APIs

### 1. Create Notification
**POST** `/api/notifications`

**Request Body**:
```json
{
  "title": "string",
  "message": "string",
  "type": "order|payment|promotion|system|review",
  "userId": "string (optional)",
  "adminId": "string (optional)",
  "orderId": "string (optional)",
  "productId": "string (optional)",
  "promotionId": "string (optional)",
  "couponId": "string (optional)"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Notification created",
  "data": {...}
}
```

---

### 2. Get All Notifications
**GET** `/api/notifications`

**Query Parameters**:
```
userId: string
adminId: string
type: string
isRead: boolean
page: number
limit: number
```

**Response** (200):
```json
{
  "success": true,
  "message": "Notifications retrieved",
  "data": {
    "notifications": [...],
    "pagination": {...}
  }
}
```

---

### 3. Get Notification by ID
**GET** `/api/notifications/:id`

**Response** (200):
```json
{
  "success": true,
  "message": "Notification retrieved",
  "data": {...}
}
```

---

### 4. Update Notification
**PUT** `/api/notifications/:id`

**Request Body**:
```json
{
  "title": "string",
  "message": "string",
  "isRead": boolean
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Notification updated",
  "data": {...}
}
```

---

### 5. Delete Notification
**DELETE** `/api/notifications/:id`

**Response** (200):
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### 6. Mark All as Read
**PUT** `/api/notifications/mark-all-as-read`

**Request Body**:
```json
{
  "userId": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 👥 User Management APIs (Admin)

### 1. Get All Users
**GET** `/api/users/all`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
role: string
status: string
page: number
limit: number
```

**Response** (200):
```json
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "users": [...],
    "pagination": {...}
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 2. Get User by ID
**GET** `/api/users/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "User retrieved",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 3. Update User (Admin)
**PUT** `/api/users/update/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "fullName": "string",
  "role": "user|admin",
  "status": "active|inactive",
  "isBlocked": boolean
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "User updated",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 4. Delete User (Admin)
**DELETE** `/api/users/delete/:id`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "User deleted"
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 5. Update Avatar
**PUT** `/api/users/me/avatar`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body**:
```
avatar: image file
```

**Response** (200):
```json
{
  "success": true,
  "message": "Avatar updated",
  "data": {
    "avatar": "string"
  }
}
```

**Authentication**: Required

---

## 📊 Statistics APIs (Admin)

### 1. Overview Statistics
**GET** `/api/statistics/overview`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Overview statistics",
  "data": {
    "totalUsers": number,
    "totalProducts": number,
    "totalOrders": number,
    "totalRevenue": number,
    "pendingOrders": number,
    "processingOrders": number,
    "shippedOrders": number,
    "deliveredOrders": number,
    "cancelledOrders": number
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 2. Revenue Statistics
**GET** `/api/statistics/revenue`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
period: year|month|week
year: number
month: number
```

**Response** (200):
```json
{
  "success": true,
  "message": "Revenue statistics",
  "data": {
    "totalRevenue": number,
    "revenueByPeriod": [...]
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 3. Top Selling Products
**GET** `/api/statistics/top-selling-products`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
limit: number (default: 10)
```

**Response** (200):
```json
{
  "success": true,
  "message": "Top selling products",
  "data": {
    "products": [...]
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 4. Customer Statistics
**GET** `/api/statistics/customers`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Customer statistics",
  "data": {
    "totalCustomers": number,
    "newCustomersThisMonth": number,
    "activeCustomers": number
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 5. Category Statistics
**GET** `/api/statistics/categories`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Category statistics",
  "data": {
    "categories": [...]
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

## 📈 Dashboard APIs (Admin)

### 1. Overview Stats
**GET** `/api/dashboard/overview`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Dashboard overview",
  "data": {
    "totalUsers": number,
    "totalProducts": number,
    "totalOrders": number,
    "totalRevenue": number,
    "todayRevenue": number,
    "todayOrders": number,
    "newUsersToday": number
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 2. Revenue Stats
**GET** `/api/dashboard/revenue`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
period: year|month|week
year: number
month: number
```

**Response** (200):
```json
{
  "success": true,
  "message": "Revenue stats",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 3. Top Products
**GET** `/api/dashboard/products/top`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
limit: number (default: 10)
```

**Response** (200):
```json
{
  "success": true,
  "message": "Top products",
  "data": {
    "products": [...]
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 4. User Stats
**GET** `/api/dashboard/users`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "User statistics",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 5. Review Stats
**GET** `/api/dashboard/reviews`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Review statistics",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 6. Coupon Stats
**GET** `/api/dashboard/coupons`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Coupon statistics",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 7. Category Stats
**GET** `/api/dashboard/categories`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "message": "Category statistics",
  "data": {...}
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

## 🖼️ Banner APIs

### 1. Create Banner
**POST** `/api/banners`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body**:
```
banners: image files (up to 10)
title: string
description: string
link: string
isActive: boolean
```

**Response** (201):
```json
{
  "success": true,
  "message": "Banners created",
  "data": {
    "banners": [...]
  }
}
```

**Authentication**: Required  
**Authorization**: Admin only

---

### 2. Get Banners
**GET** `/api/banners`

**Response** (200):
```json
{
  "success": true,
  "message": "Banners retrieved",
  "data": {
    "banners": [...]
  }
}
```

---

## 🏥 Health Check

### Health Check Endpoint
**GET** `/health`

**Description**: Server health check for Docker monitoring

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "string",
  "uptime": number
}
```

---

## 🔒 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests (Rate Limit)
- **500**: Internal Server Error

---

## 📝 Notes

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Auth Endpoints**: 5 requests per 15 minutes
- **Password Reset**: 3 requests per hour
- **Order Creation**: 10 requests per 15 minutes

### Authentication
- Use `Authorization: Bearer <access_token>` header for protected routes
- Access tokens expire after a short period
- Use refresh token to get new access token
- Tokens are blacklisted on logout

### File Upload
- **Max file size**: 5MB
- **Allowed formats**: jpg, jpeg, png, gif, webp
- **Product images**: Single file
- **Banner images**: Up to 10 files
- **Avatar**: Single file

### Pagination
- Default page: 1
- Default limit: 10
- Max limit: 100
- Response includes pagination metadata

---

## 🚀 Getting Started

### Example Request (cURL)
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Products
curl -X GET "http://localhost:5001/api/products?page=1&limit=10"

# Create Order (with token)
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[...],"shipping_address":{...},"payment_method":"cash"}'
```

---

## 📞 Support

For issues or questions, please contact the development team.

**Last Updated**: May 2026  
**Version**: 1.0.0
