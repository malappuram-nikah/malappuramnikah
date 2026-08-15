import { Otp } from "../../../domain/entities/otp.interface";
import { IOtpRepository } from "../../../domain/interfaces/IOtpRepository";
import { WhatsappOtpService } from "../../../infrastructure/service/WhatsappOtpService";
import otpGenerator from "otp-generator";

export class SendOtpUseCase {
  constructor(private otpRepository: IOtpRepository) {}

  async execute(phoneNumber: string): Promise<string> {
    const otpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    console.log("generated OTP:", otpCode);
    const otp = new Otp(phoneNumber, otpCode);
    await this.otpRepository.saveOtp(
      otp.otpCode,
      otp.phoneNumber,
      otp.expiresIn
    );
    
    // Dispatch OTP via WhatsApp (Meta API / UltraMsg / Dev fallback)
    await WhatsappOtpService.sendOtp(phoneNumber, otpCode);

    return otpCode;
  }
}
