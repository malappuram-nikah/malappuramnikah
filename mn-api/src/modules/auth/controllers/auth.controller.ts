import { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase } from "../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../application/use-cases/LoginUser.usecase";
import { LogoutUserUseCase } from "../application/use-cases/LogoutUser.usecase";
import { ForgotPasswordUseCase } from "../application/use-cases/ForgotPassword.usecase";
import { ResetPasswordUseCase } from "../application/use-cases/ResetPassword.usecase";
import { RefreshTokenUseCase } from "../application/use-cases/RefreshToken.usecase";
import { GetAuthStateUseCase } from "../application/use-cases/GetAuthState.usecase";
import { getUserIdFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private logoutUserUseCase: LogoutUserUseCase,
    private forgotPasswordUseCase: ForgotPasswordUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private getAuthStateUseCase: GetAuthStateUseCase
  ) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.registerUserUseCase.execute(req.body);
      sendSuccess(res, { user: result.user }, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = {
        ...req.body,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      };

      const result = await this.loginUserUseCase.execute(dto);

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

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }, "Login successful", 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = (req as any).cookies?.refreshToken || req.body?.refreshToken;
      const userId = getUserIdFromRequest(req) || undefined;

      await this.logoutUserUseCase.execute(refreshToken, userId);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      sendSuccess(res, undefined, "Logged out successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.forgotPasswordUseCase.execute(req.body);
      sendSuccess(res, undefined, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.resetPasswordUseCase.execute(req.body);
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      sendSuccess(res, undefined, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokenInput = (req as any).cookies?.refreshToken || req.body?.refreshToken;
      const result = await this.refreshTokenUseCase.execute(
        tokenInput,
        req.headers["user-agent"],
        req.ip
      );

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

      sendSuccess(res, result, "Token refreshed successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async getAuthState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(401).json({ success: false, isAuthenticated: false, message: "Unauthenticated" });
        return;
      }

      const state = await this.getAuthStateUseCase.execute(userId);
      sendSuccess(res, state, undefined, 200);
    } catch (error) {
      next(error);
    }
  }
}
