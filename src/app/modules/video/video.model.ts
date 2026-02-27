import { Schema, model } from "mongoose";
import { IVideo } from "./video.interface";

const videoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },

    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },

    duration: { type: Number },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
    },

    tags: [{ type: String }],
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ title: "text", description: "text" });

export const Video = model<IVideo>("Video", videoSchema);