import { Otp } from "../../../domain/entities/otp.interface";
import { IOtpRepository } from "../../../domain/interfaces/IOtpRepository";
import { WhatsappOtpService } from "../../../infrastructure/service/WhatsappOtpService";
import { EmailOtpService } from "../../../infrastructure/service/EmailOtpService";
import otpGenerator from "otp-generator";

export class SendOtpUseCase {
  constructor(private otpRepository: IOtpRepository) {}

  async execute(targetIdentifier: string, recipientEmail?: string, recipientName?: string): Promise<string> {
    const otpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    console.log("Generated OTP code:", otpCode, "for target:", targetIdentifier);
    
    const otp = new Otp(targetIdentifier, otpCode);
    await this.otpRepository.saveOtp(
      otp.otpCode,
      otp.phoneNumber,
      otp.expiresIn
    );

    // 1. Dispatch OTP via Nodemailer Email if email is available or if target is email
    const emailToUse = targetIdentifier.includes("@") ? targetIdentifier : recipientEmail;
    if (emailToUse) {
      await EmailOtpService.sendOtp(emailToUse, otpCode, recipientName);
    }

    // 2. Dispatch OTP via WhatsApp
    if (!targetIdentifier.includes("@")) {
      await WhatsappOtpService.sendOtp(targetIdentifier, otpCode);
    }

    return otpCode;
  }
}
