import bannerModel from "../models/banner.model.js";
import { standardResponse } from "../utils/utility.function.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";

const createBanner = async (req, res) => {
  try {
    const imgUrls = [];


    // Kiểm tra xem có tệp nào được tải lên không
    if (!req.files || req.files.length === 0) {
      return standardResponse(res, 400, {
        success: false,
        message: "Vui lòng tải lên hình ảnh",
      });
    }


    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "TuHuBread/banners",
        use_filename: true,
        unique_filename: true,
      });
      imgUrls.push(result.secure_url);
      await fs.unlink(file.path);
    }
    const banner = new bannerModel({
      imgUrls,
    });
    await banner.save();
    return standardResponse(res, 201, {
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    return standardResponse(res, 500, {
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getBanners = async (req, res) => {
  try {
    const banners = await bannerModel.find();
    return standardResponse(res, 200, {
      success: true,
      message: "Banners retrieved successfully",
      data: banners,
    });
  } catch (error) {
    console.error("Error retrieving banners:", error);
    return standardResponse(res, 500, {
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export { createBanner, getBanners };
