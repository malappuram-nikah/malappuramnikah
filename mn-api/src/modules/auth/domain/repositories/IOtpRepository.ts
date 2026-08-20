export interface IOtpRepository {
  createOtp(phoneNumber: string, otpCode: string): Promise<void>;
  verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean>;
}
