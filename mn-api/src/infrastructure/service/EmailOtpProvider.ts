import { IOtpDeliveryProvider, SendOtpDeliveryInput, SendOtpDeliveryResult } from "../../domain/interfaces/IOtpDeliveryProvider.interface";
import { EmailOtpService } from "./EmailOtpService";

export class EmailOtpProvider implements IOtpDeliveryProvider {
  public readonly channel: string = "EMAIL";

  async sendOtp(input: SendOtpDeliveryInput): Promise<SendOtpDeliveryResult> {
    const { recipient, otpCode, name } = input;

    console.log(`[OTP DELIVERY] Requesting Email delivery to ${recipient} (purpose=${input.purpose || "VERIFICATION"})`);

    const result = await EmailOtpService.sendOtp(recipient, otpCode, name);

    return {
      success: result.success,
      message: result.message,
      provider: "EmailOtpService",
    };
  }
}
