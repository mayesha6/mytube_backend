import { stripe } from "../../config/stripe";
import AppError from "../../errorHelpers/AppError";
import { IPlan } from "./plan.interface";
import { Plan } from "./Plan.model";
import httpStatus from "http-status-codes";

const createPlan = async (payload: IPlan) => {
  // Step 1: Create Product in Stripe
  console.log("Creating Stripe Product with payload:", payload);

  const product = await stripe.products.create({
    name: payload.planName,
    description: payload.description || "",
    active: true,
  });

  const isLifetimePlan =
    payload.planName.toLowerCase().includes("lifetime") ||
    payload.interval === "lifetime";

  const priceConfig: any = {
    currency: payload.currency || "usd",
    unit_amount: Math.round(payload.amount * 100),
    active: true,
    product: product.id,
  };

  if (!isLifetimePlan) {
    priceConfig.recurring = {
      interval: payload.interval,
      interval_count: payload.intervalCount,
    };
    console.log("🔄 Creating SUBSCRIPTION plan");
  } else {
    console.log("🔥 Creating LIFETIME plan (one-time payment)");
  }

  const price = await stripe.prices.create(priceConfig);

  // Step 2: Create Plan in MongoDB
  const dbPlan = await Plan.create({
    planName: payload.planName,
    amount: payload.amount,
    currency: payload.currency || "usd",
    interval: payload.interval,
    intervalCount: payload.intervalCount,
    freeTrialDays: payload.freeTrialDays,
    active: payload.active ?? true,
    description: payload.description,
    features: payload.features || [],
    productId: product.id,
    priceId: price.id,
  });

  console.log("Database Plan created:", dbPlan);
  return dbPlan;
};

const updatePlan = async (planId: string, payload: Partial<IPlan>) => {
  console.log("=== Update Plan Start ===");

  const existingPlan = await Plan.findById(planId);
  if (!existingPlan) {
    throw new AppError(httpStatus.NOT_FOUND, `Plan with ID ${planId} not found`);
  }

  let productIdToUse = existingPlan.productId as string;
  let oldPriceId = existingPlan.priceId;
  let newPriceId: string | null = null;
  let stripePriceCreated = false;

  // Step 1: Ensure Stripe product exists
  try {
    await stripe.products.retrieve(productIdToUse);
  } catch (err: any) {
    if (err.code === "resource_missing") {
      console.warn(`Stripe product ${productIdToUse} not found. Creating new product...`);

      const newProduct = await stripe.products.create({
        name: payload.planName || existingPlan.planName,
        description: payload.description || existingPlan.description || "",
        active: payload.active ?? existingPlan.active ?? true,
      });

      productIdToUse = newProduct.id;
      existingPlan.productId = productIdToUse;
      await existingPlan.save();
    } else {
      throw err;
    }
  }

  const finalPlanName = payload.planName || existingPlan.planName;
  const finalInterval = payload.interval || existingPlan.interval;
  const isLifetimePlan =
    finalPlanName.toLowerCase().includes("lifetime") || finalInterval === "lifetime";

  // Step 2: Determine if pricing changed
  const pricingChanged =
    (payload.amount !== undefined && payload.amount !== existingPlan.amount) ||
    (payload.currency && payload.currency !== existingPlan.currency) ||
    (!isLifetimePlan &&
      payload.intervalCount !== undefined &&
      payload.intervalCount !== existingPlan.intervalCount) ||
    (payload.interval && payload.interval !== existingPlan.interval);

  if (pricingChanged) {
    console.log("Pricing changed, creating new Stripe price...");

    const priceConfig: any = {
      currency: payload.currency || existingPlan.currency || "usd",
      unit_amount: Math.round((payload.amount || existingPlan.amount) * 100),
      active: true,
      product: productIdToUse,
    };

    if (!isLifetimePlan) {
      priceConfig.recurring = {
        interval: payload.interval || existingPlan.interval,
        interval_count: payload.intervalCount || existingPlan.intervalCount,
      };
    }

    const newPrice = await stripe.prices.create(priceConfig);
    newPriceId = newPrice.id;
    stripePriceCreated = true;

    // Deactivate old price
    if (oldPriceId) {
      try {
        await stripe.prices.update(oldPriceId, { active: false });
      } catch (err: any) {
        if (err.code !== "resource_missing") throw err;
      }
    }
  } else {
    newPriceId = existingPlan.priceId as string;
  }

  // Step 3: Update plan in MongoDB
  existingPlan.planName = payload.planName ?? existingPlan.planName;
  existingPlan.amount = payload.amount ?? existingPlan.amount;
  existingPlan.currency = payload.currency ?? existingPlan.currency;
  existingPlan.interval = payload.interval ?? existingPlan.interval;
  existingPlan.intervalCount = payload.intervalCount ?? existingPlan.intervalCount;
  existingPlan.freeTrialDays = payload.freeTrialDays ?? existingPlan.freeTrialDays;
  existingPlan.active = payload.active ?? existingPlan.active;
  existingPlan.description = payload.description ?? existingPlan.description;
  existingPlan.features = payload.features ?? existingPlan.features;
  existingPlan.priceId = newPriceId;
  await existingPlan.save();

  console.log("=== Update Plan Success ===");
  return existingPlan;
};

const getAllPlans = async () => {
  return await Plan.find();
};

const getPlanById = async (planId: string) => {
  return await Plan.findById(planId);
};

const deletePlan = async (planId: string) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, `Plan with ID ${planId} not found`);
  }

  // Deactivate Stripe price/product
  if (plan.priceId) {
    try {
      await stripe.prices.update(plan.priceId, { active: false });
    } catch {}
  }

  if (plan.productId) {
    try {
      await stripe.products.update(plan.productId, { active: false });
    } catch {}
  }

  await plan.deleteOne();

  return { message: `Plan with ID ${planId} deleted successfully` };
};

export const PlanServices = {
  createPlan,
  updatePlan,
  getAllPlans,
  getPlanById,
  deletePlan,
};