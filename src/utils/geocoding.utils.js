import axios from 'axios';

/**
 * Tính khoảng cách giữa hai điểm sử dụng Haversine formula
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách tính bằng km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Lấy tọa độ từ địa chỉ sử dụng Nominatim API (OpenStreetMap)
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Object|null} Object chứa lat, lon hoặc null nếu lỗi
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        countrycodes: 'vn' // Chỉ tìm kiếm ở Việt Nam
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};

/**
 * Lấy tọa độ từ địa chỉ cụ thể (reverse geocoding)
 * @param {number} lat - Vĩ độ
 * @param {number} lon - Kinh độ
 * @returns {Object|null} Object chứa thông tin địa chỉ hoặc null nếu lỗi
 */
export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lon,
        format: 'json',
        addressdetails: 1
      },
        headers: {
          'User-Agent': 'TuHuBreadServer/1.0'
        }
    });

    if (response.data) {
      return {
        display_name: response.data.display_name,
        address: response.data.address,
        lat: response.data.lat,
        lon: response.data.lon
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
};

/**
 * Tính phí vận chuyển dựa trên khoảng cách
 * @param {number} distance - Khoảng cách tính bằng km
 * @returns {Object} Object chứa phí vận chuyển và thời gian giao hàng
 */
export const calculateShippingFeeByDistance = (distance) => {
  let fee = 0;
  let estimatedTime = '';
  let zone = '';

  if (distance <= 5) {
    fee = 15000; // 15k cho khu vực gần (≤5km)
    estimatedTime = '15-30 phút';
    zone = 'Nội thành gần';
  } else if (distance <= 10) {
    fee = 20000; // 20k cho khu vực trung bình (5-10km)
    estimatedTime = '30-45 phút';
    zone = 'Nội thành trung bình';
  } else if (distance <= 20) {
    fee = 30000; // 30k cho khu vực xa (10-20km)
    estimatedTime = '45-60 phút';
    zone = 'Nội thành xa';
  } else if (distance <= 30) {
    fee = 40000; // 40k cho khu vực rất xa (20-30km)
    estimatedTime = '60-90 phút';
    zone = 'Ngoại thành gần';
  } else {
    fee = 50000; // 50k cho khu vực ngoại thành (>30km)
    estimatedTime = '90-120 phút';
    zone = 'Ngoại thành xa';
  }

  return { fee, estimatedTime, zone };
};

/**
 * Tọa độ các điểm trung tâm chính của Hà Nội
 */
export const HANOI_CENTERS = {
  HOAN_KIEM: { lat: 21.0285, lon: 105.8542, name: 'Hoàn Kiếm' },
  BA_DINH: { lat: 21.0352, lon: 105.8342, name: 'Ba Đình' },
  DONG_DA: { lat: 21.0198, lon: 105.8235, name: 'Đống Đa' },
  HAI_BA_TRUNG: { lat: 21.0122, lon: 105.8444, name: 'Hai Bà Trưng' },
  THANH_XUAN: { lat: 21.0367, lon: 105.8033, name: 'Thanh Xuân' },
  CAU_GIAY: { lat: 21.0367, lon: 105.7833, name: 'Cầu Giấy' },
  NAM_TU_LIEM: { lat: 21.0167, lon: 105.7833, name: 'Nam Từ Liêm' },
  TAY_HO: { lat: 21.0667, lon: 105.8167, name: 'Tây Hồ' },
  HA_DONG: { lat: 20.9667, lon: 105.7833, name: 'Hà Đông' },
  HOANG_MAI: { lat: 20.9833, lon: 105.8500, name: 'Hoàng Mai' },
  LONG_BIEN: { lat: 21.0333, lon: 105.8833, name: 'Long Biên' },
  BAC_TU_LIEM: { lat: 21.0667, lon: 105.7833, name: 'Bắc Từ Liêm' }
};

/**
 * Tìm trung tâm gần nhất với địa chỉ
 * @param {number} lat - Vĩ độ địa chỉ
 * @param {number} lon - Kinh độ địa chỉ
 * @returns {Object} Trung tâm gần nhất
 */
export const findNearestCenter = (lat, lon) => {
  let nearestCenter = null;
  let minDistance = Infinity;

  for (const [key, center] of Object.entries(HANOI_CENTERS)) {
    const distance = calculateDistance(lat, lon, center.lat, center.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCenter = { ...center, key, distance };
    }
  }

  return nearestCenter;
};

/**
 * Tạo địa chỉ đầy đủ từ các thành phần
 * @param {Object} addressComponents - Các thành phần địa chỉ
 * @returns {string} Địa chỉ đầy đủ
 */
export const buildFullAddress = (addressComponents) => {
  const { fullAddress, ward, province } = addressComponents;
  return `${fullAddress}, ${ward}, ${province}`;
};

/**
 * Validate địa chỉ có hợp lệ cho Hà Nội không
 * @param {string} province - Tỉnh/thành phố
 * @returns {boolean} True nếu hợp lệ
 */
export const isValidHanoiAddress = (province) => {
  if (!province) return false;
  return province.toLowerCase().includes('hà nội') || 
         province.toLowerCase().includes('ha noi') ||
         province.toLowerCase().includes('hanoi');
};
