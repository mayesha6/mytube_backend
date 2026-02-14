import { Document } from "mongoose";

export enum Interval {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  LIFETIME = "lifetime",
}

export interface IPlan extends Document {
  planName: string;
  amount: number;
  currency?: string;
  interval: Interval;
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