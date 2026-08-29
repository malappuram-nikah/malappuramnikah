import { IOtpRepository } from "../../../domain/interfaces/IOtpRepository";
import { OtpService } from "../../services/OtpService";
import { OtpDeliveryResolver } from "../../../infrastructure/service/OtpDeliveryResolver";
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
    const recipient = channel === "EMAIL"
      ? (targetIdentifier.includes("@") ? targetIdentifier : (recipientEmail || targetIdentifier))
      : targetIdentifier;

    const provider = OtpDeliveryResolver.resolveProvider(channel);
    try {
      await provider.sendOtp({
        recipient,
        otpCode,
        name: recipientName,
        purpose,
      });
    } catch (err) {
      console.error(`[OTP DELIVERY ERROR] Channel ${channel} delivery failed:`, err);
    }

    return otpCode;
  }
}
