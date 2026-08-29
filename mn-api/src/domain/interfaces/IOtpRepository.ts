import { OtpChannel, OtpPurpose, OtpRecord, OtpSaveParams } from "../entities/otp-core.interface";

export interface IOtpRepository {
  // Legacy backward-compatible signature
  saveOtp(otp: string, phoneNumber: string, expiresIn?: number, channel?: string, purpose?: string): Promise<void>;
  getOtp(phoneNumber: string): Promise<string | null>;
  deleteOtp(phoneNumber: string): Promise<void>;

  // Enhanced multi-channel & multi-purpose repository methods
  saveOtpRecord(params: OtpSaveParams): Promise<OtpRecord>;
  findActiveOtpRecord(userId: number, channel?: OtpChannel, purpose?: OtpPurpose): Promise<OtpRecord | null>;
  incrementAttempts(recordId: number): Promise<number>;
  deleteOtpRecord(recordId: number): Promise<void>;
  deleteUserOtps(userId: number, channel?: OtpChannel, purpose?: OtpPurpose): Promise<void>;
  checkResendCooldown(userId: number, channel?: OtpChannel, purpose?: OtpPurpose, cooldownSeconds?: number): Promise<{ inCooldown: boolean; remainingSeconds: number }>;
}