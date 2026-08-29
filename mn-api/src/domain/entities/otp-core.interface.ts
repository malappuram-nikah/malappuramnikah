export type OtpChannel = "EMAIL" | "WHATSAPP";

export type OtpPurpose =
  | "VERIFICATION"
  | "REGISTRATION"
  | "PASSWORD_RESET"
  | "LOGIN"
  | "EMAIL_VERIFICATION"
  | "PHONE_VERIFICATION";

export interface OtpRecord {
  id: number;
  user_id: number;
  otp_code: string;
  channel: string;
  purpose: string;
  attempts: number;
  expires_at: Date;
  is_verified: boolean;
  created_at: Date;
}

export interface OtpSaveParams {
  userId: number;
  hashedOtp: string;
  channel?: OtpChannel;
  purpose?: OtpPurpose;
  expiresInSeconds?: number;
}

export interface OtpVerifyParams {
  userId: number;
  otpCode: string;
  channel?: OtpChannel;
  purpose?: OtpPurpose;
  maxAttempts?: number;
}

export interface OtpVerifyResult {
  valid: boolean;
  message: string;
  attemptsExceeded?: boolean;
  expired?: boolean;
}
