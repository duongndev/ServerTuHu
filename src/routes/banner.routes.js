import express from 'express';
const router = express.Router();
import * as bannerCtrl from "../controllers/banner.controller.js";
import upload from "../middlewares/multerMiddleware.js";

router.post("/create", upload.array("banners", 5), bannerCtrl.createBanner);

router.get("/", bannerCtrl.getBanners);

export default router;
