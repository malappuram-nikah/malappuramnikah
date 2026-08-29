import { IOtpRepository } from "../../../domain/interfaces/IOtpRepository";
import { OtpService } from "../../services/OtpService";
import { EmailOtpService } from "../../../infrastructure/service/EmailOtpService";
import { OtpChannel, OtpPurpose } from "../../../domain/entities/otp-core.interface";

export class SendOtpUseCase {
  constructor(private otpRepository: IOtpRepository) {}

  async execute(
    targetIdentifier: string,
    recipientEmail?: string,
    recipientName?: string,
    channel: OtpChannel = "EMAIL",
    purpose: OtpPurpose = "VERIFICATION"
  ): Promise<string> {
    const result = await OtpService.requestOtp({
      targetIdentifier,
      channel,
      purpose,
    });

    if (!result.success || !result.otpCode) {
      throw new Error(result.message || "Failed to generate OTP");
    }

    const otpCode = result.otpCode;
    const emailToUse = targetIdentifier.includes("@") ? targetIdentifier : recipientEmail;

    if (emailToUse && channel === "EMAIL") {
      try {
        await EmailOtpService.sendOtp(emailToUse, otpCode, recipientName);
      } catch (err) {
        console.error(`[EMAIL OTP ERROR] Failed to send to ${emailToUse}:`, err);
      }
    }

    return otpCode;
  }
}
