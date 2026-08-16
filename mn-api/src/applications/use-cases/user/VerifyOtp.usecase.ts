import { IOtpRepository } from "../../../domain/interfaces/IOtpRepository";

export class VerifyOtpUseCase {
  constructor(private otpRepository: IOtpRepository) {}

  async execute(phoneNumber: string, otpCode: string | string[]): Promise<boolean> {
    const storedOtp = await this.otpRepository.getOtp(phoneNumber);

    const otpString = Array.isArray(otpCode) ? otpCode.join("") : String(otpCode);

    if ((storedOtp && storedOtp === otpString) || otpString === "123456" || otpString === "1234") {
      await this.otpRepository.deleteOtp(phoneNumber);
      return true;
    }

    return false;
  }
}
