export interface ISmsService {
  sendOtpSms(mobileNumber: string, otp: string): Promise<boolean>;
}
