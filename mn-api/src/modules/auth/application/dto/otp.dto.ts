export interface SendOtpDto {
  mobile_number: string;
  email?: string;
  type?: "REGISTRATION" | "PASSWORD_RESET" | "LOGIN";
}

export interface VerifyOtpDto {
  mobile_number: string;
  otp_code: string;
  userAgent?: string;
  ipAddress?: string;
}
