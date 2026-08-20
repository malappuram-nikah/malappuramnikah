import { Router } from "express";
import { OtpController } from "../controllers/otp.controller";
import { SendOtpUseCase } from "../application/use-cases/SendOtp.usecase";
import { VerifyOtpUseCase } from "../application/use-cases/VerifyOtp.usecase";
import { PrismaUserRepository } from "../infrastructure/repositories/PrismaUserRepository";
import { PrismaOtpRepository } from "../infrastructure/repositories/PrismaOtpRepository";

const otpRouter = Router();

const userRepository = new PrismaUserRepository();
const otpRepository = new PrismaOtpRepository();

const sendOtpUseCase = new SendOtpUseCase(otpRepository);
const verifyOtpUseCase = new VerifyOtpUseCase(otpRepository);

const otpController = new OtpController(sendOtpUseCase, verifyOtpUseCase, userRepository);

otpRouter.post("/resend-otp", (req, res, next) => otpController.resendOtp(req, res, next));
otpRouter.post("/verify-otp", (req, res, next) => otpController.verifyOtp(req, res, next));

export default otpRouter;
