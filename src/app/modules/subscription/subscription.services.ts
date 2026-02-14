import { Types } from "mongoose";
import Stripe from "stripe";
import status from "http-status";
import { Subscription } from "./subscription.model";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { handlePaymentIntentFailed, handlePaymentIntentSucceeded } from "../../utils/webhook";
import { Plan } from "../Plan/Plan.model";
import { Interval } from "../Plan/plan.interface";
import { stripe } from "../../config/stripe";
import { PaymentStatus } from "./subscription.interface";

const createSubscription = async (userId: string, planId: string) => {
  console.log("createSubscription - userId:", userId);

  const user = await User.findById(userId);
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  const plan = await Plan.findById(planId);
  if (!plan) throw new AppError(status.NOT_FOUND, "Plan not found");

  const isLifetimePlan =
    plan.planName.toUpperCase().includes("LIFETIME") ||
    plan.interval === Interval.LIFETIME;

  const startDate = new Date();
  let endDate: Date | null = null;

  if (!isLifetimePlan) {
    if (plan.interval === Interval.MONTH) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (plan.intervalCount || 1));
    } else if (plan.interval === Interval.YEAR) {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + (plan.intervalCount || 1));
    }
  }

  // 💳 Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(plan.amount * 100),
    currency: "usd",
    metadata: {
      userId: user._id.toString(),
      planId: plan._id.toString(),
      planType: isLifetimePlan ? "lifetime" : "subscription",
    },
    automatic_payment_methods: { enabled: true },
  });

  // Check existing pending subscription
  const existingSubscription = await Subscription.findOne({
    userId: user._id,
  });

  let subscription;

  if (existingSubscription?.paymentStatus === PaymentStatus.PENDING) {
    subscription = await Subscription.findByIdAndUpdate(
      existingSubscription._id,
      {
        planId: plan._id,
        stripePaymentId: paymentIntent.id,
        startDate,
        amount: plan.amount,
        ...(endDate ? { endDate } : {}),
        paymentStatus: PaymentStatus.PENDING,
      },
      { new: true }
    );
  } else {
    subscription = await Subscription.create({
      userId: user._id,
      planId: plan._id,
      startDate,
      ...(endDate ? { endDate } : {}),
      amount: plan.amount,
      stripePaymentId: paymentIntent.id,
      paymentStatus: PaymentStatus.PENDING,
    });
  }

  return {
    subscription,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    planType: isLifetimePlan ? Interval.LIFETIME : "subscription",
  };
};

const getAllSubscription = async () => {
  const data = await Subscription.find()
    .populate("userId")
    .populate("planId")
    .sort({ createdAt: -1 });

  return data;
};

const getSingleSubscription = async (subscriptionId: string) => {
  const result = await Subscription.findById(subscriptionId)
    .populate("userId")
    .populate("planId");

  if (!result) throw new AppError(status.NOT_FOUND, "Subscription not found!");
  return result;
};

const getMySubscription = async (userId: string) => {
  const result = await Subscription.findOne({
    userId: new Types.ObjectId(userId),
  })
    .populate("userId")
    .populate("planId");

  if (!result) throw new AppError(status.NOT_FOUND, "Subscription not found!");
  return result;
};

const updateSubscription = async (subscriptionId: string, data: any) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription)
    throw new AppError(status.NOT_FOUND, "Subscription not found");

  return await Subscription.findByIdAndUpdate(subscriptionId, data, {
    new: true,
  });
};

const deleteSubscription = async (subscriptionId: string) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription)
    throw new AppError(status.NOT_FOUND, "Subscription not found");

  await subscription.deleteOne();
};

const HandleStripeWebhook = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.planType === "lifetime") {
          await handleLifetimePaymentSuccess(session);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Webhook failed");
  }
};

const handleLifetimePaymentSuccess = async (
  session: Stripe.Checkout.Session
) => {
  const { userId, planId } = session.metadata!;

  await Subscription.updateMany(
    {
      userId: new Types.ObjectId(userId),
      planId: new Types.ObjectId(planId),
      paymentStatus: "PENDING",
    },
    {
      paymentStatus: "COMPLETED",
      stripePaymentId: session.payment_intent as string,
    }
  );

  await User.findByIdAndUpdate(userId, {
    isSubscribed: true,
    planExpiration: null,
  });

  console.log("✅ Lifetime payment completed:", userId);
};

export const SubscriptionServices = {
  createSubscription,
  getAllSubscription,
  getSingleSubscription,
  getMySubscription,
  updateSubscription,
  deleteSubscription,
  HandleStripeWebhook,
};