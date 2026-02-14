import mongoose, { Schema } from "mongoose";
import { Interval, IPlan } from "./plan.interface";

const PlanSchema: Schema = new Schema<IPlan>(
  {
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String },
    interval: { type: String, enum: Interval, default: Interval.MONTH },
    intervalCount: { type: Number, required: true },
    freeTrialDays: { type: Number },
    productId: { type: String },
    priceId: { type: String },
    active: { type: Boolean, default: true },
    description: { type: String },
    features: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: "plans" }
);

export const Plan = mongoose.model<IPlan>("Plan", PlanSchema);