import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { stripe } from "../../config/stripe";
import { PaymentService } from "./webhook.service";
import { envVars } from "../../config/env";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = envVars.STRIPE_WEBHOOK_SECRET as string;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Signature verification failed:", err.message);
    return;
  }

  await PaymentService.HandleStripeWebhook(event);

  res.status(200).send("Webhook received");
});

export const PaymentController = {
  handleStripeWebhook,
};
