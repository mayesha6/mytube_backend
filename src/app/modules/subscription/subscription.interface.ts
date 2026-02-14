import { Document, Types } from "mongoose";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  amount: number;
  stripePaymentId: string;
  paymentStatus: PaymentStatus;
  description?: string;
  benefitsIncluded?: string;
  createdAt: Date;
  updatedAt: Date;
}