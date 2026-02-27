import Stripe from "stripe";
import { handleLifetimePaymentSuccess, handlePaymentIntentFailed, handlePaymentIntentSucceeded } from "../../utils/webhook";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

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

export const PaymentService = {
  HandleStripeWebhook,
};