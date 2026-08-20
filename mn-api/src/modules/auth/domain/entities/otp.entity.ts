export interface OtpEntity {
  id: number;
  user_id: number;
  otp_code: string;
  expires_at: Date;
  is_verified: boolean;
  attempts?: number;
  created_at: Date;
}
