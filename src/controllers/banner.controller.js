import bannerModel from "../models/banner.model.js";
import { standardResponse } from "../middlewares/middleware.js";
import { uploadImage } from "../service/upload.service.js"; // Use service

const createBanner = async (req, res) => {
  try {
    const imgUrls = [];

    // Kiểm tra xem có tệp nào được tải lên không
    if (!req.files || req.files.length === 0) {
      return standardResponse(res, 400, {
        success: false,
        message: "Please upload an image file",
      });
    }

    // Loop through files and upload using service
    // Note: uploadImage handles cleanup automatically
    for (const file of req.files) {
      try {
        const secureUrl = await uploadImage(file.path, "TuHuBread/banners");
        imgUrls.push(secureUrl);
      } catch (uploadError) {
        console.error(`Failed to upload file ${file.originalname}:`, uploadError);
        // Continue with other files or abort? Usually better to try all or abort all.
        // Current logic pushes success ones.
      }
    }
    
    if (imgUrls.length === 0) {
        return standardResponse(res, 500, {
            success: false,
            message: "Failed to upload any images",
        });
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
