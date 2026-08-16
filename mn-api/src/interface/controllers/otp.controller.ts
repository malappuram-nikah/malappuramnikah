import { Request, Response } from "express";
import { SendOtpUseCase } from "../../applications/use-cases/user/SentOtp.usecase";
import { VerifyOtpUseCase } from "../../applications/use-cases/user/VerifyOtp.usecase";
import { AuthService } from "../../infrastructure/service/AuthService.service";
import { accessTokenConfig } from "../../infrastructure/config/jwt.config";
import { getAccountBlockForUser } from "../../infrastructure/helpers/accountStatus.helpers";
import prisma from "../../infrastructure/prisma/prisamClient";

export class OtpController {
  constructor(
    private sendOtpUseCase: SendOtpUseCase,
    private verifyOtpUseCase: VerifyOtpUseCase
  ) {}

  async resendOtp(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
      }

      const user = await prisma.user.findUnique({ where: { mobile_number: phoneNumber } });
      if (!user) {
        return res.status(404).json({ success: false, message: "No account found for this mobile number" });
      }

      const accountBlock = getAccountBlockForUser(user);
      if (accountBlock) {
        return res.status(accountBlock.httpStatus).json({
          success: false,
          message: accountBlock.message,
          code: accountBlock.code,
        });
      }

      const generatedOtp = await this.sendOtpUseCase.execute(phoneNumber);
      const responseBody: Record<string, unknown> = {
        success: true,
        message: "OTP sent successfully",
      };
      if (process.env.NODE_ENV !== "production") {
        responseBody.otp = generatedOtp;
      }
      return res.status(200).json(responseBody);
    } catch (error) {
      console.error("Resend OTP error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error sending OTP" });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { phoneNumber, otpCode, userId } = req.body;

      if (!phoneNumber || !otpCode) {
        return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
      }

      const codeString = Array.isArray(otpCode) ? otpCode.join("") : String(otpCode);
      const isValid = await this.verifyOtpUseCase.execute(phoneNumber, codeString);

      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      const user = await prisma.user.findUnique({ where: { mobile_number: phoneNumber } });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const accountBlock = getAccountBlockForUser(user);
      if (accountBlock) {
        return res.status(accountBlock.httpStatus).json({
          success: false,
          message: accountBlock.message,
          code: accountBlock.code,
        });
      }

      if (userId && Number(userId) !== user.id) {
        return res.status(400).json({ success: false, message: "User does not match the provided phone number" });
      }

      if (user.status === "in_active") {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: "active" },
        });
      }

      const accessToken = AuthService.generateToken(
        { userId: user.id },
        accessTokenConfig
      );

      return res.status(200).json({
        accessToken,
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error verifying OTP" });
    }
  }
}
