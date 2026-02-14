import mongoose, { Schema } from "mongoose";
import { ISubscription, PaymentStatus } from "./subscription.interface";

const SubscriptionSchema: Schema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    amount: { type: Number, required: true },
    stripePaymentId: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: PaymentStatus, default: PaymentStatus.PENDING },
    description: { type: String },
    benefitsIncluded: { type: String },
  },
  { timestamps: true, collection: "subscriptions" }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);