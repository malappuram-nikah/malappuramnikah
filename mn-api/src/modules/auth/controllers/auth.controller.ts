import { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase } from "../application/use-cases/RegisterUser.usecase";
import { LoginUserUseCase } from "../application/use-cases/LoginUser.usecase";
import { SendOtpUseCase } from "../application/use-cases/SendOtp.usecase";
import { ForgotPasswordUseCase } from "../application/use-cases/ForgotPassword.usecase";
import { ResetPasswordUseCase } from "../application/use-cases/ResetPassword.usecase";
import { sendSuccess } from "../../../shared/utils/response.util";

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private sendOtpUseCase: SendOtpUseCase,
    private forgotPasswordUseCase: ForgotPasswordUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase
  ) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const phoneNumber = req.body.mobile_number;
      const user = await this.registerUserUseCase.execute(req.body);
      const generatedOtp = await this.sendOtpUseCase.execute(
        phoneNumber,
        req.body.email,
        `${req.body.first_name || ""} ${req.body.last_name || ""}`
      );

      const { password, ...safeUser } = user as any;
      const isUnverified = user.status === "in_active";

      sendSuccess(
        res,
        { user: safeUser },
        isUnverified
          ? "Your account has already been created but is not yet verified. Please verify your OTP to activate your account."
          : "Registration successful",
        200,
        {
          ...(isUnverified ? { unverified: true } : {}),
          ...(process.env.NODE_ENV !== "production" ? { otp: generatedOtp } : {}),
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.loginUserUseCase.execute({
        mobile_number: req.body.mobile_number,
        password: req.body.password,
      });

      if (result.status !== 200) {
        res.status(result.status).json({
          success: false,
          message: result.message,
          code: result.code,
        });
        return;
      }

      const isProd = process.env.NODE_ENV === "production";
      if (result.refreshToken) {
        res.cookie("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      sendSuccess(res, undefined, result.message, 200, { token: result.token });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, identifier, mobile_number } = req.body;
      const input = (identifier || email || mobile_number || "").toString().trim();
      const { targetEmail, otpCode } = await this.forgotPasswordUseCase.execute(input, email);

      sendSuccess(
        res,
        undefined,
        `Password reset verification code sent to your email address (${targetEmail}).`,
        200,
        {
          email: targetEmail,
          identifier: input,
          devOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, identifier, mobile_number, otp, newPassword } = req.body;
      const input = (identifier || email || mobile_number || "").toString().trim();

      await this.resetPasswordUseCase.execute(input, otp, newPassword);

      sendSuccess(
        res,
        undefined,
        "Password reset successfully! You can now log in with your new password.",
        200
      );
    } catch (error) {
      next(error);
    }
  }
}
