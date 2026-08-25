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

    // If target is mobile and recipient email is also provided (or vice-versa), also register OTP under the alternate identifier
    const emailToUse = targetIdentifier.includes("@") ? targetIdentifier : recipientEmail;
    const phoneToUse = !targetIdentifier.includes("@") ? targetIdentifier : undefined;

    if (emailToUse && emailToUse !== targetIdentifier) {
      await this.otpRepository.saveOtp(otpCode, emailToUse, otp.expiresIn);
    }

    // 1. Dispatch OTP via Email
    if (emailToUse) {
      try {
        await EmailOtpService.sendOtp(emailToUse, otpCode, recipientName);
      } catch (err) {
        console.error(`[EMAIL OTP ERROR] Failed to send to ${emailToUse}:`, err);
      }
    }

    // 2. Dispatch OTP via WhatsApp (if mobile is available and credentials are configured)
    if (phoneToUse) {
      const hasWaConfig = !!(
        process.env.META_WA_ACCESS_TOKEN ||
        process.env.WHATSAPP_TOKEN ||
        process.env.MSG91_AUTH_KEY ||
        process.env.ULTRAMSG_TOKEN
      );
      if (hasWaConfig) {
        try {
          await WhatsappOtpService.sendOtp(phoneToUse, otpCode);
        } catch (err) {
          console.error(`[WHATSAPP OTP ERROR] Failed to send to ${phoneToUse}:`, err);
        }
      }
    }

    return otpCode;
  }
}
