import { z } from "zod";

export const createVideoValidationSchema = z.object({
  body: z.object({
    title: z.string({ message: "Title is required" }),
    description: z.string().optional(),
    videoUrl: z.string({ message: "Video URL is required" }),
    thumbnailUrl: z.string().optional(),
    duration: z.number().optional(),

    visibility: z.enum(["public", "private", "unlisted"]).optional(),
    isPremium: z.boolean().optional(),

    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
  }),
});

export const updateVideoValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    visibility: z.enum(["public", "private", "unlisted"]).optional(),
    isPremium: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
  }),
});