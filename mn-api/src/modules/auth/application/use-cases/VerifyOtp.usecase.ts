import crypto from "crypto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { VerifyOtpDto } from "../dto/otp.dto";
import { validateMobileNumber, validateOtpCode } from "../../schemas/auth.schema";
import { rateLimiterService } from "../../infrastructure/security/rateLimiter.service";
import { generateToken } from "../../../../shared/auth/jwt.util";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class VerifyOtpUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOtpRepository,
    private sessionRepository: ISessionRepository
  ) {}

  async execute(dto: VerifyOtpDto): Promise<{ message: string; accessToken: string; refreshToken: string; user: any }> {
    const validMobile = validateMobileNumber(dto.mobile_number);
    const validOtp = validateOtpCode(dto.otp_code);

    const limitKey = `otp_attempts:${validMobile}`;
    rateLimiterService.checkOtpAttemptLimit(limitKey);

    const user = await this.userRepository.findByMobileNumber(validMobile);
    if (!user) {
      rateLimiterService.recordFailedOtpAttempt(limitKey);
      throw new NotFoundError("User not found.");
    }

    const latestOtp = await this.otpRepository.findLatestOtp(user.id);
    if (!latestOtp) {
      rateLimiterService.recordFailedOtpAttempt(limitKey);
      throw new BadRequestError("No OTP request found. Please request a new OTP.");
    }

    if (latestOtp.is_verified) {
      throw new BadRequestError("This OTP has already been used.");
    }

    if (latestOtp.expires_at < new Date()) {
      rateLimiterService.recordFailedOtpAttempt(limitKey);
      throw new BadRequestError("OTP has expired. Please request a new OTP.");
    }

    if (latestOtp.otp_code !== validOtp) {
      rateLimiterService.recordFailedOtpAttempt(limitKey);
      throw new BadRequestError("Invalid OTP code.");
    }

    rateLimiterService.resetOtpAttemptLimit(limitKey);
    await this.otpRepository.markOtpAsVerified(latestOtp.id);

    if (user.status === "in_active") {
      await this.userRepository.updateStatus(user.id, "active");
    }

    const accessToken = generateToken({
      userId: user.id,
      mobile_number: user.mobile_number,
      email: user.email,
      isAdmin: false,
    });

    const refreshToken = generateToken(
      { userId: user.id, type: "refresh", jti: crypto.randomUUID() },
      "7d"
    );

    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionRepository.createSession(
      user.id,
      refreshToken,
      refreshTokenExpiresAt,
      dto.userAgent,
      dto.ipAddress
    );

    const updatedUser = await this.userRepository.findById(user.id);
    const { password, ...safeUser } = (updatedUser || user) as any;

    return {
      message: "Mobile number verified successfully.",
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }
}
