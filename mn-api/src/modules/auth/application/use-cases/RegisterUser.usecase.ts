import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IOtpRepository } from "../../domain/repositories/IOtpRepository";
import { RegisterUserDto } from "../dto/register.dto";
import {
  validateMobileNumber,
  validatePassword,
  verifyGmailAvailability,
} from "../../schemas/auth.schema";
import { ConflictError, ValidationError } from "../../../../shared/errors/AppError";

export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOtpRepository
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ user: any; message: string; otp_code?: string }> {
    const validMobile = validateMobileNumber(dto.mobile_number);
    const validPassword = validatePassword(dto.password);

    let validEmail: string | null = null;
    if (dto.email) {
      validEmail = await verifyGmailAvailability(dto.email);
    }

    const existingMobileUser = await this.userRepository.findByMobileNumber(validMobile);
    if (existingMobileUser) {
      throw new ConflictError("User with this mobile number already exists.");
    }

    if (validEmail) {
      const existingEmailUser = await this.userRepository.findByEmail(validEmail);
      if (existingEmailUser) {
        throw new ConflictError("User with this email address already exists.");
      }
    }

    const passwordHash = await bcrypt.hash(validPassword, 10);

    const user = await this.userRepository.createUser(
      {
        profile_for: dto.profile_for || "Self",
        gender: dto.gender,
        first_name: dto.first_name,
        last_name: dto.last_name,
        cast: dto.cast,
        location: dto.location,
        email: validEmail,
        mobile_number: validMobile,
        password: passwordHash,
        dob: dto.dob,
        status: "in_active",
        is_premium: false,
        is_new_user: true,
        referral_points: 0,
      },
      dto.referralCode
    );

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    await this.otpRepository.createOtp(user.id, otpCode, expiresAt);

    const { password, ...safeUser } = user as any;

    return {
      user: safeUser,
      message: "Registration successful. OTP sent to mobile number.",
    };
  }
}
