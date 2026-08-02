import { Request, Response } from "express";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { VerifyOtpUseCase } from "../../applications/use-cases/user/VerifyOtp.usecase";
import { AuthService } from "../../infrastructure/service/AuthService.service";
import { accessTokenConfig } from "../../infrastructure/config/jwt.config";
import prisma from "../../infrastructure/prisma/prisamClient";

export class OtpController {
  constructor(
    private sendOtpUseCase: SendOtpUseCase,
    private verifyOtpUseCase: VerifyOtpUseCase
  ) {}

  async resendOtp(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;

      const generatedOtp = await this.sendOtpUseCase.execute(phoneNumber);
      return res
        .status(200)
        .json({ success: true, otp: generatedOtp, message: "OTP sent successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Error sending OTP" });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { phoneNumber, otpCode, userId } = req.body;
      const codeString = Array.isArray(otpCode) ? otpCode.join("") : String(otpCode);
      const isValid = await this.verifyOtpUseCase.execute(phoneNumber, codeString);

      if (isValid) {
        // Activate the existing user account
        if (userId) {
          await prisma.user.update({
            where: { id: Number(userId) },
            data: { status: "active" }
          });
        } else {
          await prisma.user.update({
            where: { mobile_number: phoneNumber },
            data: { status: "active" }
          });
        }

        const accessToken = AuthService.generateToken(
          { userId },
          accessTokenConfig
        );

        return res
          .status(200)
          .json({
            accessToken,
            success: true,
            message: "OTP verified successfully",
          });
      }

      return res.status(400).json({ success: false, message: "Invalid OTP" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Error verifying OTP" });
    }
  }
}
