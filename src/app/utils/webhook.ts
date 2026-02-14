import Stripe from "stripe";
import httpStatus from "http-status";
import AppError from "../errorHelpers/AppError";
import { Interval } from "../modules/Plan/plan.interface";
import { Subscription } from "../modules/subscription/subscription.model";
import { User } from "../modules/user/user.model";


const calculateEndDate = (
  startDate: Date,
  interval: Interval,
  intervalCount: number
): Date => {
  const endDate = new Date(startDate);

  switch (interval) {
    case Interval.WEEK:
      endDate.setDate(endDate.getDate() + 7 * intervalCount);
      break;
    case Interval.MONTH:
      endDate.setMonth(endDate.getMonth() + intervalCount);
 
      if (endDate.getDate() !== startDate.getDate()) {
        endDate.setDate(0); 
      }
      break;
    case Interval.YEAR:
      endDate.setFullYear(endDate.getFullYear() + intervalCount);
      break;
    default:
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Unsupported interval: ${interval}`
      );
  }

  return endDate;
};

const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent
) => {

  const payment = await Subscription.findOne({
    stripePaymentId: paymentIntent.id,
  }).populate("planId");

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Payment not found for ID: ${paymentIntent.id}`
    );
  }
const plan: any = payment.planId;
  if (!plan) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Plan not found for this subscription"
    );
  }

  if (paymentIntent.status !== "succeeded") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment intent is not in succeeded state"
    );
  }

  const startDate = new Date();
  const endDate = calculateEndDate(
    startDate,
    plan.interval,
    plan.intervalCount
  );


  // 1️⃣ Update user subscription status
  await User.findByIdAndUpdate(payment.userId, {
    isSubscribed: true,
    planExpiration: endDate,
  });

  // 2️⃣ Update subscription record
  await Subscription.findByIdAndUpdate(payment._id, {
    paymentStatus: "COMPLETED",
    startDate,
    endDate,
  });
};

const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const payment = await Subscription.findOne({
    stripePaymentId: paymentIntent.id,
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  await Subscription.findByIdAndUpdate(payment._id, {
    paymentStatus: "CANCELED",
    endDate: new Date(),
  });
};


export { handlePaymentIntentSucceeded, handlePaymentIntentFailed };
