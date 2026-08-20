import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { ForgotPasswordDto } from "../dto/password.dto";
import { validateMobileNumber } from "../../schemas/auth.schema";
import { rateLimiterService } from "../../infrastructure/security/rateLimiter.service";

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOtpRepository
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<{ message: string; otp_code?: string }> {
    const validMobile = validateMobileNumber(dto.mobile_number);

    const user = await this.userRepository.findByMobileNumber(validMobile);
    if (!user) {
      return { message: "If an account with this number exists, an OTP has been sent." };
    }

    const cooldownKey = `otp_cooldown:${validMobile}`;
    try {
      rateLimiterService.checkOtpDispatchCooldown(cooldownKey);
    } catch {
      return { message: "If an account with this number exists, an OTP has been sent." };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.otpRepository.createOtp(user.id, otpCode, expiresAt);
    rateLimiterService.recordOtpDispatch(cooldownKey);

    return {
      message: "If an account with this number exists, an OTP has been sent.",
      otp_code: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    };
  }
}
