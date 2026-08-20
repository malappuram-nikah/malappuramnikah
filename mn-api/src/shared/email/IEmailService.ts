export interface IEmailService {
  sendOtpEmail(email: string, otp: string): Promise<boolean>;
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}
