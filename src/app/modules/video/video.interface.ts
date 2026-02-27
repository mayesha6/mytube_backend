import { Types } from "mongoose";

export type TVideoVisibility = "public" | "private" | "unlisted";

export interface IVideo {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;

  owner: Types.ObjectId;

  visibility: TVideoVisibility;
  isPremium: boolean;

  views: number;

  tags?: string[];
  category?: string;
}