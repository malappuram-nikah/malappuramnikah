import { IOtpRepository } from "../../../domain/interfaces/IOtpRepository";
import { OtpService } from "../../services/OtpService";
import { OtpChannel, OtpPurpose } from "../../../domain/entities/otp-core.interface";

export class VerifyOtpUseCase {
  constructor(private otpRepository: IOtpRepository) {}

  async execute(
    phoneNumber: string,
    otpCode: string | string[],
    channel: OtpChannel = "EMAIL",
    purpose: OtpPurpose = "VERIFICATION"
  ): Promise<boolean> {
    const result = await OtpService.verifyOtp({
      targetIdentifier: phoneNumber,
      otpCode,
      channel,
      purpose,
    });

    return result.valid;
  }
}
