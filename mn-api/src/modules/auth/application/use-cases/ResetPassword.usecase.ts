import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { ResetPasswordDto } from "../dto/password.dto";
import { validateMobileNumber, validateOtpCode, validatePassword } from "../../schemas/auth.schema";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class ResetPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOtpRepository,
    private sessionRepository: ISessionRepository
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ message: string }> {
    const validMobile = validateMobileNumber(dto.mobile_number);
    const validOtp = validateOtpCode(dto.otp_code);
    const validNewPassword = validatePassword(dto.new_password);

    const user = await this.userRepository.findByMobileNumber(validMobile);
    if (!user) {
      throw new NotFoundError("User account not found.");
    }

    const latestOtp = await this.otpRepository.findLatestOtp(user.id);
    if (!latestOtp || latestOtp.is_verified || latestOtp.expires_at < new Date() || latestOtp.otp_code !== validOtp) {
      throw new BadRequestError("Invalid or expired OTP code.");
    }

    const newPasswordHash = await bcrypt.hash(validNewPassword, 10);
    await this.userRepository.updatePassword(user.id, newPasswordHash);

    // Invalidate all existing sessions and refresh tokens for this user
    await this.sessionRepository.revokeAllUserSessions(user.id);
    await this.otpRepository.markOtpAsVerified(latestOtp.id);

    return { message: "Password reset successful. You can now login with your new password." };
  }
}
