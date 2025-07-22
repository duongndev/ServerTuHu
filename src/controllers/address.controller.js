import axios from "axios";
import addressModel from "../models/address.model.js";
import { standardResponse } from "../utils/utility.function.js";

// Tạo mới địa chỉ
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiver_name, phone, province, ward, full_address, is_default } =req.body;
    if (!receiver_name || !phone || !province || !ward || !full_address) {
      return standardResponse(res, 400, {
        success: false,
        message: "Thiếu trường bắt buộc",
      });
    }
    // Nếu là địa chỉ mặc định, bỏ mặc định các địa chỉ khác
    if (is_default) {
      await addressModel.updateMany({ userId }, { isDefault: false });
    }
    const newAddress = new addressModel({
      userId,
      receiverName: receiver_name,
      phone,
      province,
      ward,
      fullAddress: full_address,
      isDefault: !!is_default,
    });
    await newAddress.save();
    return standardResponse(res, 201, {
      success: true,
      message: "Tạo địa chỉ thành công",
      data: newAddress,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy tất cả địa chỉ của user
const getAddressesByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await addressModel
      .find({ userId })
      .sort({ isDefault: -1, createdAt: -1 });
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy danh sách địa chỉ thành công",
      data: addresses,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy tất cả địa chỉ
const getAllAddresses = async (req, res) => {
  try {
    const addresses = await addressModel.find();
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy tất cả địa chỉ thành công",
      data: addresses,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Lấy địa chỉ theo id
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await addressModel.findById(id);
    if (!address) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy địa chỉ thành công",
      data: address,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật địa chỉ
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const address = await addressModel.findById(id);
    if (!address) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }
    if (address.userId.toString() !== userId) {
      return standardResponse(res, 403, {
        success: false,
        message: "Không có quyền cập nhật địa chỉ này",
      });
    }
    const { receiverName, phone, province, ward, fullAddress, isDefault } =
      req.body;
    if (!receiverName || !phone || !province || !ward || !fullAddress) {
      return standardResponse(res, 400, {
        success: false,
        message: "Thiếu trường bắt buộc",
      });
    }
    // Nếu là địa chỉ mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      await addressModel.updateMany({ userId }, { isDefault: false });
    }
    const updatedAddress = await addressModel.findByIdAndUpdate(
      id,
      {
        receiverName,
        phone,
        province,
        ward,
        fullAddress,
        isDefault: !!isDefault,
      },
      { new: true }
    );
    return standardResponse(res, 200, {
      success: true,
      message: "Cập nhật địa chỉ thành công",
      data: updatedAddress,
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

// Xóa địa chỉ
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const address = await addressModel.findById(id);
    if (!address) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy địa chỉ",
      });
    }
    if (address.userId.toString() !== userId) {
      return standardResponse(res, 403, {
        success: false,
        message: "Không có quyền xóa địa chỉ này",
      });
    }
    await addressModel.findByIdAndDelete(id);
    return standardResponse(res, 200, {
      success: true,
      message: "Xóa địa chỉ thành công",
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

const getProvince = async (req, res) => {
  try {
    const province = await axios.get(
      "https://vietnamlabs.com/api/vietnamprovince"
    );

    const data = province.data;

    // Lấy trường "province" trong mảng data
    const provinces = data.data.map((item) => item.province);
    res.json(provinces);
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

const getWards = async (req, res) => {
  try {

    // Lấy danh sách xã/phường theo tỉnh
    // province sẽ được truyền qua query string, ví dụ: ?province=Hà Nội
    const { province } = req.query;
    if (!province) {
      return standardResponse(res, 400, {
        success: false,
        message: "Thiếu tên tỉnh/thành phố",
      });
    }

    // Gọi API lấy danh sách tỉnh/thành phố
    const response = await axios.get("https://vietnamlabs.com/api/vietnamprovince");
    const data = response.data && response.data.data ? response.data.data : [];

    // Tìm tỉnh/thành phố khớp tên
    const foundProvince = data.find(item => item.province === province);

    if (!foundProvince) {
      return standardResponse(res, 404, {
        success: false,
        message: "Không tìm thấy tỉnh/thành phố",
      });
    }

    // Lấy danh sách xã/phường từ trường "wards"
    const wards = foundProvince.wards || [];

    // res.json(wards);
    
    // Chỉ lấy mỗi trường name trong danh sách xã/phường
    const wardNames = wards.map(ward => ward.name);
    
    res.json(wardNames);

  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: error.message,
    });
  }
};

export {
  createAddress,
  getAddressesByUser,
  getAllAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  getProvince,
  getWards
};
