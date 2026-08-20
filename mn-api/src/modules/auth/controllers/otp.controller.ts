import { Request, Response, NextFunction } from "express";
import { SendOtpUseCase } from "../application/use-cases/SendOtp.usecase";
import { VerifyOtpUseCase } from "../application/use-cases/VerifyOtp.usecase";
import { IUserRepository } from "../domain/repositories/IUserRepository";
import { generateToken } from "../../../shared/auth/jwt.util";
import { config } from "../../../config";
import { getAccountBlockForUser } from "../../../infrastructure/helpers/accountStatus.helpers";
import { sendSuccess } from "../../../shared/utils/response.util";
import { BadRequestError, NotFoundError } from "../../../shared/errors/AppError";

export class OtpController {
  constructor(
    private sendOtpUseCase: SendOtpUseCase,
    private verifyOtpUseCase: VerifyOtpUseCase,
    private userRepository: IUserRepository
  ) {}

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, email } = req.body;
      const targetInput = (phoneNumber || email || "").toString().trim();
      if (!targetInput) {
        throw new BadRequestError("Mobile number or email address is required");
      }

      let user = await this.userRepository.findByEmail(targetInput);
      if (!user) {
        user = await this.userRepository.findByMobile(targetInput);
      }

      if (!user) {
        throw new NotFoundError("No account found matching this mobile number or email address.");
      }

      const accountBlock = getAccountBlockForUser(user);
      if (accountBlock) {
        res.status(accountBlock.httpStatus).json({
          success: false,
          message: accountBlock.message,
          code: accountBlock.code,
        });
        return;
      }

      const targetEmail = targetInput.includes("@")
        ? targetInput.toLowerCase()
        : (user.email && user.email.includes("@") ? user.email : (email || "").trim().toLowerCase());

      if (!targetEmail) {
        throw new BadRequestError("Please enter your email address to receive your verification code.");
      }

      const generatedOtp = await this.sendOtpUseCase.execute(
        user.mobile_number,
        targetEmail,
        `${user.first_name || ""} ${user.last_name || ""}`
      );

      sendSuccess(
        res,
        undefined,
        `Verification code sent successfully to your email (${targetEmail}).`,
        200,
        process.env.NODE_ENV !== "production" ? { otp: generatedOtp } : {}
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, email, otpCode, userId } = req.body;
      const targetInput = (phoneNumber || email || "").toString().trim();
      if (!targetInput || !otpCode) {
        throw new BadRequestError("Phone number or email and OTP are required");
      }

      let user = await this.userRepository.findByEmail(targetInput);
      if (!user) {
        user = await this.userRepository.findByMobile(targetInput);
      }

      if (!user || !user.id) {
        throw new NotFoundError("User account not found");
      }

      const isValid = await this.verifyOtpUseCase.execute(user.mobile_number, otpCode)
        || await this.verifyOtpUseCase.execute(targetInput, otpCode);

      if (!isValid) {
        throw new BadRequestError("Invalid verification code. Please check and try again.");
      }

      const accountBlock = getAccountBlockForUser(user);
      if (accountBlock) {
        res.status(accountBlock.httpStatus).json({
          success: false,
          message: accountBlock.message,
          code: accountBlock.code,
        });
        return;
      }

      if (user.status === "in_active") {
        user = await this.userRepository.updateStatus(user.id, "active");
      }

      const accessToken = generateToken({ userId: user.id }, config.jwt.expiresIn);

      sendSuccess(res, undefined, "OTP verified successfully", 200, { accessToken });
    } catch (error) {
      next(error);
    }
  }
}
