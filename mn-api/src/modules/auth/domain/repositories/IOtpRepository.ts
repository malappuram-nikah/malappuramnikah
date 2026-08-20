import { OtpEntity } from "../entities/otp.entity";

export interface IOtpRepository {
  createOtp(userId: number, otpCode: string, expiresAt: Date): Promise<OtpEntity>;
  findLatestOtp(userId: number): Promise<OtpEntity | null>;
  markOtpAsVerified(id: number): Promise<void>;
  invalidatePreviousOtps(userId: number): Promise<void>;
}
