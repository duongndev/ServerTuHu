const { standardResponse } = require("../utils/utility.function");
const addressModel = require("../models/address.model");

/**
 * API: Tính phí vận chuyển nội bộ Hà Nội dựa trên zone
 * @route GET /api/shipping/fee/:addressId
 * @access Private (user)
 */
const calculateInternalShippingFee = async (req, res) => {
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
    if (!address.province || !address.province.toLowerCase().includes("hà nội")) {
      return standardResponse(res, 400, {
        success: false,
        message: "Chỉ hỗ trợ tính phí cho địa chỉ ở Hà Nội",
      });
    }
    // Mapping zone theo quận/huyện
    const innerDistricts = [
      "Ba Đình",
      "Hoàn Kiếm",
      "Đống Đa",
      "Hai Bà Trưng",
      "Thanh Xuân",
      "Cầu Giấy",
      "Nam Từ Liêm",
      "Tây Hồ",
    ];
    const middleDistricts = [
      "Hà Đông",
      "Hoàng Mai",
      "Long Biên",
      "Bắc Từ Liêm",
    ];
    let zone = 3;
    if (innerDistricts.some((name) => address.ward && address.ward.includes(name))) zone = 1;
    else if (middleDistricts.some((name) => address.ward && address.ward.includes(name))) zone = 2;
    // Phí và thời gian giao hàng
    const deliveryFees = { 1: 15000, 2: 20000, 3: 30000 };
    const deliveryTimes = { 1: "15-30 phút", 2: "30-45 phút", 3: "45-60 phút" };

    const fullAddress = `${address.fullAddress}, ${address.ward}, ${address.province}`

    return standardResponse(res, 200, {
      success: true,
      message: "Tính phí vận chuyển thành công",
      data: {
        delivery_fee: deliveryFees[zone],
        estimated_time: deliveryTimes[zone],
        delivery_address: fullAddress
      },
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

module.exports = { calculateInternalShippingFee };
