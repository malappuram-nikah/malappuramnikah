import { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase } from "../../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../../application/use-cases/LoginUser.usecase";
import { LogoutUserUseCase } from "../../application/use-cases/LogoutUser.usecase";
import { ForgotPasswordUseCase } from "../../application/use-cases/ForgotPassword.usecase";
import { ResetPasswordUseCase } from "../../application/use-cases/ResetPassword.usecase";
import { ChangePasswordUseCase } from "../../application/use-cases/ChangePassword.usecase";
import { VerifyEmailUseCase } from "../../application/use-cases/VerifyEmail.usecase";
import { RefreshTokenUseCase } from "../../application/use-cases/RefreshToken.usecase";
import { GetAuthStateUseCase } from "../../application/use-cases/GetAuthState.usecase";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { PrismaOtpRepository } from "../../infrastructure/repositories/PrismaOtpRepository";
import { PrismaSessionRepository } from "../../infrastructure/repositories/PrismaSessionRepository";
import { sendSuccess, sendError } from "../../../../shared/utils/response.util";

const userRepository = new PrismaUserRepository();
const otpRepository = new PrismaOtpRepository();
const sessionRepository = new PrismaSessionRepository();

const registerUserUseCase = new RegisterUserUseCase(userRepository, otpRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository, sessionRepository);
const logoutUserUseCase = new LogoutUserUseCase(sessionRepository);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, otpRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository, otpRepository, sessionRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository, sessionRepository);
const verifyEmailUseCase = new VerifyEmailUseCase(userRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, sessionRepository);
const getAuthStateUseCase = new GetAuthStateUseCase(userRepository);

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registerUserUseCase.execute(req.body);
      sendSuccess(res, result.user, result.message, 201, { otp_code: result.otp_code });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;
      const result = await loginUserUseCase.execute({ ...req.body, userAgent, ipAddress });

      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, result.user, "Login successful.", 200, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await logoutUserUseCase.execute(refreshToken);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      sendSuccess(res, null, "Logged out successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await forgotPasswordUseCase.execute(req.body);
      sendSuccess(res, null, result.message, 200, { otp_code: result.otp_code });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await resetPasswordUseCase.execute(req.body);
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await changePasswordUseCase.execute({ userId, ...req.body });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await verifyEmailUseCase.execute({ userId, email: req.body.email });
      sendSuccess(res, null, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenInput = req.cookies?.refreshToken || req.body?.refreshToken;
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;

      const result = await refreshTokenUseCase.execute(refreshTokenInput, userAgent, ipAddress);

      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, null, "Token refreshed successfully.", 200, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAuthState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const user = await getAuthStateUseCase.execute(userId);
      sendSuccess(res, user, "Authenticated user state fetched successfully.", 200);
    } catch (err) {
      next(err);
    }
  }
}
