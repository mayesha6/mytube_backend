import { Document, Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

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