// src/modules/otp/otp.routes.ts
import express from "express";
import { OTPController } from "./otp.controller";

const router = express.Router();



router.post("/verify-reset", OTPController.verifyResetOtp);
export const OtpRoutes = router;
