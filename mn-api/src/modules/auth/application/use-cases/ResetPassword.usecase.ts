import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class ResetPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOtpRepository
  ) {}

  async execute(input: string, otp: string, newPassword: string): Promise<void> {
    const cleanInput = (input || "").toString().trim().toLowerCase();
    if (!cleanInput) {
      throw new BadRequestError("Mobile number or email address is required.");
    }
    if (!otp || typeof otp !== "string" || !otp.trim()) {
      throw new BadRequestError("Verification code is required.");
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      throw new BadRequestError("New password must be at least 6 characters long.");
    }

    let user = await this.userRepository.findByEmail(cleanInput);
    if (!user) {
      user = await this.userRepository.findByMobile(input);
    }

    if (!user || !user.id) {
      throw new NotFoundError("User account not found.");
    }

    const targetKey = user.email || user.mobile_number;
    const isValid = await this.otpRepository.verifyOtp(targetKey, otp)
      || await this.otpRepository.verifyOtp(cleanInput, otp);

    if (!isValid) {
      throw new BadRequestError("Invalid or expired verification code.");
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await this.userRepository.updateUser(user.id, { password: hashedPassword });
  }
}
