import { standardResponse } from "../utils/utility.function.js";
import addressModel from "../models/address.model.js";
import {
  geocodeAddress,
  calculateDistance,
  calculateShippingFeeByDistance,
  buildFullAddress,
  isValidHanoiAddress,
  findNearestCenter,
  HANOI_CENTERS
} from "../utils/geocoding.utils.js";

/**
 * API: Tính phí vận chuyển sử dụng OpenStreetMap
 * @route GET /api/shipping/fee/:addressId
 * @access Private (user)
 */
const calculateShippingFee = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;

    // Lấy địa chỉ giao hàng
    const address = await addressModel.findById(addressId);
    if (!address) {
      return standardResponse(res, 404, {
        success: false,
        message: "Địa chỉ không tồn tại",
      });
    }

    if (address.userId.toString() !== userId) {
      return standardResponse(res, 403, {
        success: false,
        message: "Không có quyền sử dụng chức năng này",
      });
    }

    // Chỉ hỗ trợ Hà Nội
    if (!isValidHanoiAddress(address.province)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Chỉ hỗ trợ tính phí cho địa chỉ ở Hà Nội",
      });
    }

    // Tạo địa chỉ đầy đủ để geocode
    const fullAddress = buildFullAddress(address);
    
    // Lấy tọa độ địa chỉ giao hàng
    const deliveryCoords = await geocodeAddress(fullAddress);
    if (!deliveryCoords) {
      return standardResponse(res, 400, {
        success: false,
        message: "Không thể xác định tọa độ địa chỉ giao hàng",
      });
    }

    // Tìm trung tâm gần nhất
    const nearestCenter = findNearestCenter(deliveryCoords.lat, deliveryCoords.lon);
    
    // Tính khoảng cách thực tế
    const distance = calculateDistance(
      nearestCenter.lat, 
      nearestCenter.lon, 
      deliveryCoords.lat, 
      deliveryCoords.lon
    );

    // Tính phí vận chuyển dựa trên khoảng cách
    const { fee, estimatedTime, zone } = calculateShippingFeeByDistance(distance);

    // Thông tin chi tiết về địa chỉ
    const addressInfo = {
      full_address: fullAddress,
      coordinates: {
        latitude: deliveryCoords.lat,
        longitude: deliveryCoords.lon
      },
      nearest_center: {
        name: nearestCenter.name,
        coordinates: {
          latitude: nearestCenter.lat,
          longitude: nearestCenter.lon
        },
        distance_from_center: Math.round(nearestCenter.distance * 100) / 100
      },
      distance_from_center: Math.round(distance * 100) / 100,
      zone: zone
    };

    return standardResponse(res, 200, {
      success: true,
      message: "Tính phí vận chuyển thành công",
      data: {
        delivery_fee: fee,
        estimated_time: estimatedTime,
        address_info: addressInfo,
        distance_km: Math.round(distance * 100) / 100,
        zone: zone
      },
    });

  } catch (error) {
    console.error('Shipping fee calculation error:', error);
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi tính phí vận chuyển: " + error.message,
    });
  }
};

/**
 * API: Tính phí vận chuyển từ địa chỉ cụ thể
 * @route POST /api/shipping/fee/calculate
 * @access Private (user)
 */
const calculateShippingFeeFromAddress = async (req, res) => {
  try {
    const { fullAddress, ward, district, province } = req.body;
    const userId = req.user.id;

    if (!fullAddress || !ward || !district || !province) {
      return standardResponse(res, 400, {
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin địa chỉ",
      });
    }

    // Chỉ hỗ trợ Hà Nội
    if (!isValidHanoiAddress(province)) {
      return standardResponse(res, 400, {
        success: false,
        message: "Chỉ hỗ trợ tính phí cho địa chỉ ở Hà Nội",
      });
    }

    // Tạo địa chỉ đầy đủ để geocode
    const completeAddress = buildFullAddress({ fullAddress, ward, district, province });
    
    // Lấy tọa độ địa chỉ
    const addressCoords = await geocodeAddress(completeAddress);
    if (!addressCoords) {
      return standardResponse(res, 400, {
        success: false,
        message: "Không thể xác định tọa độ địa chỉ",
      });
    }

    // Tìm trung tâm gần nhất
    const nearestCenter = findNearestCenter(addressCoords.lat, addressCoords.lon);
    
    // Tính khoảng cách
    const distance = calculateDistance(
      nearestCenter.lat, 
      nearestCenter.lon, 
      addressCoords.lat, 
      addressCoords.lon
    );

    // Tính phí vận chuyển
    const { fee, estimatedTime, zone } = calculateShippingFeeByDistance(distance);

    return standardResponse(res, 200, {
      success: true,
      message: "Tính phí vận chuyển thành công",
      data: {
        delivery_fee: fee,
        estimated_time: estimatedTime,
        address: completeAddress,
        coordinates: {
          latitude: addressCoords.lat,
          longitude: addressCoords.lon
        },
        nearest_center: {
          name: nearestCenter.name,
          coordinates: {
            latitude: nearestCenter.lat,
            longitude: nearestCenter.lon
          }
        },
        distance_from_center: Math.round(distance * 100) / 100,
        zone: zone
      },
    });

  } catch (error) {
    console.error('Shipping fee calculation error:', error);
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi tính phí vận chuyển: " + error.message,
    });
  }
};

/**
 * API: Lấy thông tin chi tiết về địa chỉ
 * @route GET /api/shipping/address-info/:addressId
 * @access Private (user)
 */
const getAddressInfo = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;

    const address = await addressModel.findById(addressId);
    if (!address) {
      return standardResponse(res, 404, {
        success: false,
        message: "Địa chỉ không tồn tại",
      });
    }

    if (address.userId.toString() !== userId) {
      return standardResponse(res, 403, {
        success: false,
        message: "Không có quyền truy cập địa chỉ này",
      });
    }

    const fullAddress = buildFullAddress(address);
    const coords = await geocodeAddress(fullAddress);

    if (!coords) {
      return standardResponse(res, 400, {
        success: false,
        message: "Không thể xác định tọa độ địa chỉ",
      });
    }

    // Tìm trung tâm gần nhất
    const nearestCenter = findNearestCenter(coords.lat, coords.lon);
    const distance = calculateDistance(
      nearestCenter.lat, 
      nearestCenter.lon, 
      coords.lat, 
      coords.lon
    );

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy thông tin địa chỉ thành công",
      data: {
        address: fullAddress,
        coordinates: coords,
        province: address.province,
        district: address.district,
        ward: address.ward,
        nearest_center: {
          name: nearestCenter.name,
          coordinates: {
            latitude: nearestCenter.lat,
            longitude: nearestCenter.lon
          }
        },
        distance_from_center: Math.round(distance * 100) / 100
      },
    });

  } catch (error) {
    console.error('Get address info error:', error);
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy thông tin địa chỉ: " + error.message,
    });
  }
};

/**
 * API: Lấy danh sách các trung tâm Hà Nội
 * @route GET /api/shipping/centers
 * @access Public
 */
const getHanoiCenters = async (req, res) => {
  try {
    const centers = Object.values(HANOI_CENTERS).map(center => ({
      name: center.name,
      coordinates: {
        latitude: center.lat,
        longitude: center.lon
      }
    }));

    return standardResponse(res, 200, {
      success: true,
      message: "Lấy danh sách trung tâm Hà Nội thành công",
      data: {
        centers: centers,
        total: centers.length
      },
    });

  } catch (error) {
    console.error('Get Hanoi centers error:', error);
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy danh sách trung tâm: " + error.message,
    });
  }
};

export { 
  calculateShippingFee, 
  calculateShippingFeeFromAddress, 
  getAddressInfo,
  getHanoiCenters
};
