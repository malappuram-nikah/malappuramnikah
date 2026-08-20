import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { EmailOtpService } from "../../../../infrastructure/service/EmailOtpService";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOtpRepository
  ) {}

  async execute(input: string, emailParam?: string): Promise<{ targetEmail: string; otpCode: string }> {
    const cleanInput = (input || "").toString().trim().toLowerCase();
    if (!cleanInput) {
      throw new BadRequestError("Please provide your mobile number or email address.");
    }

    let user = await this.userRepository.findByEmail(cleanInput);
    if (!user) {
      user = await this.userRepository.findByMobile(input);
    }

    if (!user) {
      throw new NotFoundError("No account found matching this mobile number or email address.");
    }

    const providedEmail = cleanInput.includes("@") ? cleanInput : (emailParam || "").trim().toLowerCase();
    const targetEmail = cleanInput.includes("@")
      ? cleanInput
      : (user.email && user.email.includes("@") ? user.email : (providedEmail.includes("@") ? providedEmail : ""));

    if (!targetEmail) {
      throw new BadRequestError("No email address found for this account. Please enter your email address to receive your password reset code.");
    }

    if (user.id && targetEmail && (!user.email || user.email.trim() === "")) {
      await this.userRepository.updateUser(user.id, { email: targetEmail }).catch(() => {});
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpRepository.createOtp(targetEmail, otpCode);

    await EmailOtpService.sendOtp(targetEmail, otpCode, `${user.first_name || ""} ${user.last_name || ""}`);

    return { targetEmail, otpCode };
  }
}
