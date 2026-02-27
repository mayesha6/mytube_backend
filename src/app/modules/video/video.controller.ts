import { Request, Response } from "express";
import { VideoService } from "./video.services";
import AppError from "../../errorHelpers/AppError";
import { JwtPayload } from "jsonwebtoken";

const createVideo = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, "Video file is required");

    const decodedToken = req.user as JwtPayload;
    const owner = decodedToken.userId;

  const payload = {
    ...req.body,
    owner,
  };

  const video = await VideoService.createVideo(payload, req.file.buffer, req.file.originalname);

  res.status(201).json({
    success: true,
    message: "Video uploaded successfully",
    data: video,
  });
};



const getAllVideos = async (req: Request, res: Response) => {
  const result = await VideoService.getAllVideos(req.query);

  res.status(200).json({
    success: true,
    message: "Videos retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
};

const getSingleVideo = async (req: Request, res: Response) => {
  const result = await VideoService.getSingleVideo(req.params.id);

  res.status(200).json({
    success: true,
    data: result,
  });
};

const updateVideo = async (req: Request, res: Response) => {
  const result = await VideoService.updateVideo(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Video updated successfully",
    data: result,
  });
};

const deleteVideo = async (req: Request, res: Response) => {
  const videoId = req.params.id;

  await VideoService.deleteVideo(videoId);

  res.status(200).json({
    success: true,
    message: "Video deleted successfully",
  });
};


const incrementView = async (req: Request, res: Response) => {
  await VideoService.incrementView(req.params.id);

  res.status(200).json({
    success: true,
    message: "View counted",
  });
};

export const VideoController = {
  createVideo,
  getAllVideos,
  getSingleVideo,
  updateVideo,
  deleteVideo,
  incrementView,
};