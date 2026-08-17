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

    // 1. Dispatch OTP via Nodemailer Email (Primary OTP Channel)
    const emailToUse = targetIdentifier.includes("@") ? targetIdentifier : recipientEmail;
    if (emailToUse) {
      await EmailOtpService.sendOtp(emailToUse, otpCode, recipientName);
    } else {
      console.warn(`[OTP WARNING] Email address missing for target ${targetIdentifier}. Unable to deliver Email OTP.`);
    }

    // 2. WhatsApp / SMS OTP is currently disabled per configuration. Email OTP is primary.
    // if (!targetIdentifier.includes("@")) {
    //   await WhatsappOtpService.sendOtp(targetIdentifier, otpCode);
    // }

    return otpCode;
  }
}
