import { Request, Response, NextFunction } from "express";
import { SendOtpUseCase } from "../../application/use-cases/SendOtp.usecase";
import { VerifyOtpUseCase } from "../../application/use-cases/VerifyOtp.usecase";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { PrismaOtpRepository } from "../../infrastructure/repositories/PrismaOtpRepository";
import { PrismaSessionRepository } from "../../infrastructure/repositories/PrismaSessionRepository";
import { sendSuccess } from "../../../../shared/utils/response.util";

const userRepository = new PrismaUserRepository();
const otpRepository = new PrismaOtpRepository();
const sessionRepository = new PrismaSessionRepository();

const sendOtpUseCase = new SendOtpUseCase(userRepository, otpRepository);
const verifyOtpUseCase = new VerifyOtpUseCase(userRepository, otpRepository, sessionRepository);

export class OtpController {
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sendOtpUseCase.execute(req.body);
      sendSuccess(res, null, result.message, 200, { otp_code: result.otp_code });
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;

      const result = await verifyOtpUseCase.execute({ ...req.body, userAgent, ipAddress });

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

      sendSuccess(res, result.user, result.message, 200, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }
}
