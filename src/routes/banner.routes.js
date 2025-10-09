import express from 'express';
const router = express.Router();
import * as bannerCtrl from "../controllers/banner.controller.js";
import { secureUpload, validateUploadedFile, handleUploadError } from "../middlewares/secureUpload.middleware.js";
import { 
  uploadRateLimit,
  burstProtection 
} from "../middlewares/rateLimiting.middleware.js";

router.post("/", uploadRateLimit, burstProtection, secureUpload.array("banners", 10), validateUploadedFile, bannerCtrl.createBanner);

router.get("/", bannerCtrl.getBanners);

// Error handler for upload errors
router.use(handleUploadError);

export default router;
