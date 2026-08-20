import { Request, Response, NextFunction } from "express";
import { SendOtpUseCase } from "../application/use-cases/SendOtp.usecase";
import { VerifyOtpUseCase } from "../application/use-cases/VerifyOtp.usecase";
import { sendSuccess } from "../../../shared/utils/response.util";

export class OtpController {
  constructor(
    private sendOtpUseCase: SendOtpUseCase,
    private verifyOtpUseCase: VerifyOtpUseCase
  ) {}

  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.sendOtpUseCase.execute(req.body);
      sendSuccess(res, undefined, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = {
        ...req.body,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      };

      const result = await this.verifyOtpUseCase.execute(dto);

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
      }, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}
