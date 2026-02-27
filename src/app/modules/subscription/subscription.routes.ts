import { Router } from "express";
import { SubscriptionController } from "./subscription.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { SubscriptionValidationSchema } from "./subscription.validation";

const router = Router();

router.post(
  "/create-subscription",
  checkAuth("USER"),
  validateRequest(SubscriptionValidationSchema),
  SubscriptionController.createSubscription
);

router.get(
  "/my-subscription",
  checkAuth("USER"),
  SubscriptionController.getMySubscription
);

router.get("/", checkAuth("ADMIN"), SubscriptionController.getAllSubscription);

router.get(
  "/:subscriptionId",
  checkAuth("ADMIN"),
  SubscriptionController.getSingleSubscription
);

router.put(
  "/:subscriptionId",
  checkAuth("SUPER_ADMIN", "ADMIN"),
  SubscriptionController.updateSubscription
);

router.delete(
  "/:subscriptionId",
  checkAuth("SUPER_ADMIN", "ADMIN"),
  SubscriptionController.deleteSubscription
);


export const SubscriptionRoutes = router;
