export interface SendOtpDeliveryInput {
  recipient: string;
  otpCode: string;
  name?: string;
  purpose?: string;
}

export interface SendOtpDeliveryResult {
  success: boolean;
  message: string;
  provider?: string;
}

export interface IOtpDeliveryProvider {
  readonly channel: string;
  sendOtp(input: SendOtpDeliveryInput): Promise<SendOtpDeliveryResult>;
}
