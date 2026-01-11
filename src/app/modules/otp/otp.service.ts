import crypto from "crypto";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import { User } from "../user/user.model";
import { envVars } from "../../config/env";
import jwt from "jsonwebtoken";

const OTP_EXPIRATION = 2 * 60 // 2minute

const generateOtp = (length = 6) => {
    //6 digit otp
    const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString()
    return otp
}



const verifyResetOtp = async (email: string, otp: string) => {
  const redisKey = `otp:reset:${email}`;

  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new AppError(401, "OTP expired or invalid");
  }

  if (savedOtp !== otp) {
    throw new AppError(401, "Invalid OTP");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!user.isVerified) {
    throw new AppError(401, "User is not verified");
  }

  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const resetToken = jwt.sign(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    { expiresIn: "10m" }
  );

  await redisClient.del([redisKey]);

  return resetToken;
};


export const OTPService = {
    generateOtp,
    verifyResetOtp
}
