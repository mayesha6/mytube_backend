import { Document } from "mongoose";

export interface IPlan extends Document {
  planName: string;
  amount: number;
  currency?: string;
  interval: "day" | "week" | "month" | "year" | "lifetime";
  intervalCount: number;
  freeTrialDays?: number;
  productId?: string;
  priceId?: string;
  active: boolean;
  description?: string;
  features?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}