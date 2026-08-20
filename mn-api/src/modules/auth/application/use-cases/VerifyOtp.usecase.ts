import { IOtpRepository } from "../../domain/repositories/IOtpRepository";

export class VerifyOtpUseCase {
  constructor(private otpRepository: IOtpRepository) {}

  async execute(targetIdentifier: string, otpCode: string | string[]): Promise<boolean> {
    const codeString = Array.isArray(otpCode) ? otpCode.join("") : String(otpCode);
    return await this.otpRepository.verifyOtp(targetIdentifier, codeString);
  }
}
