import otpGenerator from "otp-generator";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { EmailOtpService } from "../../../../infrastructure/service/EmailOtpService";

export class SendOtpUseCase {
  constructor(private otpRepository: IOtpRepository) {}

  async execute(targetIdentifier: string, recipientEmail?: string, recipientName?: string): Promise<string> {
    const otpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    console.log("Generated OTP code:", otpCode, "for target:", targetIdentifier);

    await this.otpRepository.createOtp(targetIdentifier, otpCode);

    const emailToUse = targetIdentifier.includes("@") ? targetIdentifier : recipientEmail;
    if (emailToUse) {
      await EmailOtpService.sendOtp(emailToUse, otpCode, recipientName);
    } else {
      console.warn(`[OTP WARNING] Email address missing for target ${targetIdentifier}.`);
    }

    return otpCode;
  }
}
