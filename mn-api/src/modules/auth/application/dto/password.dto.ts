export interface ForgotPasswordDto {
  mobile_number: string;
}

export interface ResetPasswordDto {
  mobile_number: string;
  otp_code: string;
  new_password: string;
}
