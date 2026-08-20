import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { RegisterUserUseCase } from "../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../application/use-cases/LoginUser.usecase";
import { LogoutUserUseCase } from "../application/use-cases/LogoutUser.usecase";
import { ForgotPasswordUseCase } from "../application/use-cases/ForgotPassword.usecase";
import { ResetPasswordUseCase } from "../application/use-cases/ResetPassword.usecase";
import { RefreshTokenUseCase } from "../application/use-cases/RefreshToken.usecase";
import { GetAuthStateUseCase } from "../application/use-cases/GetAuthState.usecase";
import { PrismaUserRepository } from "../infrastructure/repositories/PrismaUserRepository";
import { PrismaOtpRepository } from "../infrastructure/repositories/PrismaOtpRepository";
import { PrismaSessionRepository } from "../infrastructure/repositories/PrismaSessionRepository";

const authRouter = Router();

const userRepository = new PrismaUserRepository();
const otpRepository = new PrismaOtpRepository();
const sessionRepository = new PrismaSessionRepository();

const registerUserUseCase = new RegisterUserUseCase(userRepository, otpRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository, sessionRepository);
const logoutUserUseCase = new LogoutUserUseCase(sessionRepository);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, otpRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository, otpRepository, sessionRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, sessionRepository);
const getAuthStateUseCase = new GetAuthStateUseCase(userRepository);

const authController = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
  logoutUserUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  refreshTokenUseCase,
  getAuthStateUseCase
);

authRouter.post("/register", (req, res, next) => authController.register(req, res, next));
authRouter.post("/login", (req, res, next) => authController.login(req, res, next));
authRouter.post("/logout", (req, res, next) => authController.logout(req, res, next));
authRouter.post("/forgot-password", (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post("/reset-password", (req, res, next) => authController.resetPassword(req, res, next));
authRouter.post("/refresh-token", (req, res, next) => authController.refreshToken(req, res, next));
authRouter.get("/me", (req, res, next) => authController.getAuthState(req, res, next));
authRouter.get("/auth-state", (req, res, next) => authController.getAuthState(req, res, next));

export default authRouter;
