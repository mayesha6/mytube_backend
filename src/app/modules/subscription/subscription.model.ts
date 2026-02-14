import mongoose from "mongoose";
import { Package, SubscriptionStatus } from "./subscription.interface";

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        plan: {
            type: String,
            enum: Object.values(Package),
            default: Package.FREE
        },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String },
        stripePriceId: { type: String },
        status: {
            type: String,
            enum: Object.values(SubscriptionStatus),
            default: SubscriptionStatus.ACTIVE
        },
        currentPeriodStart: Date,
        currentPeriodEnd: Date,
        cancelAtPeriodEnd: Boolean,
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
