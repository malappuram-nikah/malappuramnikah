import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { RegisterUserUseCase } from "../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../application/use-cases/LoginUser.usecase";
import { SendOtpUseCase } from "../application/use-cases/SendOtp.usecase";
import { ForgotPasswordUseCase } from "../application/use-cases/ForgotPassword.usecase";
import { ResetPasswordUseCase } from "../application/use-cases/ResetPassword.usecase";
import { PrismaUserRepository } from "../infrastructure/repositories/PrismaUserRepository";
import { PrismaOtpRepository } from "../infrastructure/repositories/PrismaOtpRepository";

const authRouter = Router();

const userRepository = new PrismaUserRepository();
const otpRepository = new PrismaOtpRepository();

const registerUserUseCase = new RegisterUserUseCase(userRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository);
const sendOtpUseCase = new SendOtpUseCase(otpRepository);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, otpRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository, otpRepository);

const authController = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
  sendOtpUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase
);

authRouter.post("/register", (req, res, next) => authController.register(req, res, next));
authRouter.post("/login", (req, res, next) => authController.login(req, res, next));
authRouter.post("/forgot-password", (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post("/reset-password", (req, res, next) => authController.resetPassword(req, res, next));

export default authRouter;
