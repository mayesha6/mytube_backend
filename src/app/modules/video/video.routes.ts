import express from "express";
import { VideoController } from "./video.controller";
import {
  createVideoValidationSchema,
  updateVideoValidationSchema,
} from "./video.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { multerVideoUpload } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/",
  checkAuth(...Object.values(Role), "ADMIN"),
  multerVideoUpload.single("video"),
  validateRequest(createVideoValidationSchema),
  VideoController.createVideo
);

router.get("/", VideoController.getAllVideos);

router.get("/:id", VideoController.getSingleVideo);

router.patch(
  "/:id",
  checkAuth("creator", "admin"),
  validateRequest(updateVideoValidationSchema),
  VideoController.updateVideo
);

router.delete(
  "/:id",
  checkAuth("creator", "admin"),
  VideoController.deleteVideo
);

router.post("/:id/view", VideoController.incrementView);

export const VideoRoutes = router;