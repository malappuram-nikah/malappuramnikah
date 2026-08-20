import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { SendOtpDto } from "../dto/otp.dto";
import { validateMobileNumber, verifyGmailAvailability } from "../../schemas/auth.schema";
import { rateLimiterService } from "../../infrastructure/security/rateLimiter.service";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class SendOtpUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOtpRepository
  ) {}

  async execute(dto: SendOtpDto): Promise<{ message: string; otp_code?: string }> {
    let targetUser: any = null;

    if (dto.mobile_number) {
      const validMobile = validateMobileNumber(dto.mobile_number);
      rateLimiterService.checkOtpDispatchCooldown(`otp_cooldown:${validMobile}`);
      targetUser = await this.userRepository.findByMobileNumber(validMobile);
    } else if (dto.email) {
      const validEmail = await verifyGmailAvailability(dto.email);
      rateLimiterService.checkOtpDispatchCooldown(`otp_cooldown:${validEmail}`);
      targetUser = await this.userRepository.findByEmail(validEmail);
    }

    if (!targetUser) {
      throw new NotFoundError("Account not found for the provided identifier.");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    await this.otpRepository.createOtp(targetUser.id, otpCode, expiresAt);

    const cooldownKey = dto.mobile_number ? `otp_cooldown:${dto.mobile_number}` : `otp_cooldown:${dto.email}`;
    rateLimiterService.recordOtpDispatch(cooldownKey);

    return {
      message: "OTP sent successfully.",
      otp_code: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    };
  }
}
