import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { PlanController } from "./Plan.controller";
;

const router = Router();

router.post(
  "/create-plan",
  checkAuth("SUPER_ADMIN", "ADMIN"),
  // validateRequest(planValidationSchema),
  PlanController.createPlan
);

router.get("/", PlanController.getAllPlans);

router.get("/:planId", PlanController.getPlanById);
router.patch("/:planId", PlanController.updatePlan);

router.delete(
  "/:planId",
  checkAuth("SUPER_ADMIN", "ADMIN"),
  PlanController.deletePlan
);

export const PlanRoutes = router;
