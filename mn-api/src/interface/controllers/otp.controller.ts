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
      const { phoneNumber, email } = req.body;
      const targetInput = (phoneNumber || email || "").toString().trim();

      if (!targetInput) {
        return res.status(400).json({ success: false, message: "Mobile number or email address is required" });
      }

      const isEmailInput = targetInput.includes("@");
      const providedEmail = isEmailInput ? targetInput.toLowerCase() : (email || "").toString().trim().toLowerCase();

      const orConditions: any[] = [
        { mobile_number: targetInput },
        { mobile_number: `+91${targetInput.replace(/\D/g, "").slice(-10)}` },
        { email: { equals: targetInput.toLowerCase(), mode: "insensitive" } }
      ];
      if (providedEmail) {
        orConditions.push({ email: { equals: providedEmail, mode: "insensitive" } });
      }

      // Find user by mobile_number OR email address
      let user = await prisma.user.findFirst({
        where: { OR: orConditions }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "No account found matching this mobile number or email address." });
      }

      const accountBlock = getAccountBlockForUser(user);
      if (accountBlock) {
        return res.status(accountBlock.httpStatus).json({
          success: false,
          message: accountBlock.message,
          code: accountBlock.code,
        });
      }

      // If user account is missing an email address, save the provided email to their profile
      if (providedEmail && (!user.email || user.email.trim() === "")) {
        const existingEmailAccount = await prisma.user.findFirst({
          where: {
            email: { equals: providedEmail, mode: "insensitive" },
            id: { not: user.id }
          }
        });

        if (existingEmailAccount) {
          return res.status(400).json({
            success: false,
            message: "This email address is already registered to another account. Please use a different email."
          });
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: { email: providedEmail }
        });
        console.log(`[USER EMAIL BOUND] Saved missing email ${providedEmail} to user account #${user.id}`);
      }

      const targetEmail = isEmailInput && providedEmail
        ? providedEmail
        : (user.email && user.email.includes("@") ? user.email : (providedEmail ? providedEmail : undefined));
      if (!targetEmail) {
        return res.status(400).json({
          success: false,
          message: "Please enter your email address to receive your verification code."
        });
      }

      const generatedOtp = await this.sendOtpUseCase.execute(
        user.mobile_number,
        targetEmail,
        `${user.first_name || ""} ${user.last_name || ""}`
      );

      const responseBody: Record<string, unknown> = {
        success: true,
        message: `Verification code sent successfully to your email (${targetEmail}).`,
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
      const { phoneNumber, email, otpCode, userId } = req.body;
      const targetInput = (phoneNumber || email || "").toString().trim();

      if (!targetInput || !otpCode) {
        return res.status(400).json({ success: false, message: "Phone number or email and OTP are required" });
      }

      const codeString = Array.isArray(otpCode) ? otpCode.join("") : String(otpCode);

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile_number: targetInput },
            { mobile_number: `+91${targetInput.replace(/\D/g, "").slice(-10)}` },
            { email: { equals: targetInput.toLowerCase(), mode: "insensitive" } }
          ]
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "User account not found" });
      }

      const lookupKey = user.mobile_number || targetInput;
      const isValid = await this.verifyOtpUseCase.execute(lookupKey, codeString)
        || await this.verifyOtpUseCase.execute(targetInput, codeString);

      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid verification code. Please check and try again." });
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
        return res.status(400).json({ success: false, message: "User does not match the provided details" });
      }

      // If email was verified and user had no email in DB, bind it now
      const isEmail = targetInput.includes("@");
      if (isEmail && (!user.email || user.email.trim() === "")) {
        const cleanEmail = targetInput.toLowerCase();
        const existingEmailAccount = await prisma.user.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" }, id: { not: user.id } }
        });
        if (!existingEmailAccount) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { email: cleanEmail }
          });
        }
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
