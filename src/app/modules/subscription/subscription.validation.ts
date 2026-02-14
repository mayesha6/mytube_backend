import { z } from "zod";

export const SubscriptionValidationSchema = z.object({
  planId: z.string(),
});