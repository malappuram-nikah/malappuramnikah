import { IEmailService } from "../../shared/email/IEmailService";
import { EmailOtpService } from "../service/EmailOtpService";

export class NodemailerEmailService implements IEmailService {
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    const res = await EmailOtpService.sendOtp(email, otp);
    return res.success;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const res = await EmailOtpService.sendOtp(to, "NOTIFICATION", subject);
    return res.success;
  }
}
