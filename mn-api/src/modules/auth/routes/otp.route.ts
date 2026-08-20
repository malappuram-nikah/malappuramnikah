import { Router } from "express";
import { OtpController } from "../controllers/otp.controller";
import { SendOtpUseCase } from "../application/use-cases/SendOtp.usecase";
import { VerifyOtpUseCase } from "../application/use-cases/VerifyOtp.usecase";
import { PrismaUserRepository } from "../infrastructure/repositories/PrismaUserRepository";
import { PrismaOtpRepository } from "../infrastructure/repositories/PrismaOtpRepository";
import { PrismaSessionRepository } from "../infrastructure/repositories/PrismaSessionRepository";

const otpRouter = Router();

const userRepository = new PrismaUserRepository();
const otpRepository = new PrismaOtpRepository();
const sessionRepository = new PrismaSessionRepository();

const sendOtpUseCase = new SendOtpUseCase(userRepository, otpRepository);
const verifyOtpUseCase = new VerifyOtpUseCase(userRepository, otpRepository, sessionRepository);

const otpController = new OtpController(sendOtpUseCase, verifyOtpUseCase);

otpRouter.post("/send-otp", (req, res, next) => otpController.sendOtp(req, res, next));
otpRouter.post("/verify-otp", (req, res, next) => otpController.verifyOtp(req, res, next));

export default otpRouter;
