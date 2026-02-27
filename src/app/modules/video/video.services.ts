import { deleteVideoFromCloudinary, uploadVideoToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { IVideo } from "./video.interface";
import { Video } from "./video.model";
import httpStatus from "http-status-codes";


const createVideo = async (payload: IVideo, fileBuffer: Buffer, fileName: string) => {
  // Upload video first
  const uploadResult = await uploadVideoToCloudinary(fileBuffer, fileName);

  // Save in DB
  const video = await Video.create({
    ...payload,
    videoUrl: uploadResult?.secure_url,
    views: 0,
  });

  return video;
};

const getAllVideos = async (query: Record<string, unknown>) => {
  const { search, page = 1, limit = 10 } = query;

  const filter: any = { visibility: "public" };

  if (search) {
    filter.$text = { $search: search as string };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const result = await Video.find(filter)
    .populate("owner", "name email")
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Video.countDocuments(filter);

  return { meta: { total }, result };
};

const getSingleVideo = async (id: string) => {
  const result = await Video.findById(id).populate("owner", "name");
  return result;
};

const updateVideo = async (id: string, payload: Partial<IVideo>) => {
  const result = await Video.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};



const incrementView = async (id: string) => {
  return await Video.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  );
};



const deleteVideo = async (videoId: string) => {
  const video = await Video.findById(videoId);
  if (!video) throw new AppError(httpStatus.NOT_FOUND, "Video not found");

  // Delete from Cloudinary
  await deleteVideoFromCloudinary(video.videoUrl);

  // Delete from DB
  await video.deleteOne();

  return true;
};

export const VideoService = {
  createVideo,
  getAllVideos,
  getSingleVideo,
  updateVideo,
  deleteVideo,
  incrementView,
};