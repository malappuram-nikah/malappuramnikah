import nodemailer from "nodemailer";

export interface EmailOtpResponse {
  success: boolean;
  message: string;
}

export class EmailOtpService {
  private static get emailUser(): string {
    return process.env.EMAIL_USER || process.env.SMTP_USER || "malappuramnikah@gmail.com";
  }

  private static get emailPass(): string {
    return process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  }

  /**
   * Send OTP via Nodemailer HTML Email
   */
  public static async sendOtp(toEmail: string, otpCode: string, name?: string): Promise<EmailOtpResponse> {
    if (!toEmail || !toEmail.includes("@")) {
      return { success: false, message: "Invalid email address" };
    }

    try {
      // Create Nodemailer Transporter using Gmail SMTP
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: this.emailUser,
          pass: this.emailPass,
        },
      });

      const recipientName = name || "Valued Member";

      const htmlContent = `
        <div font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #026d77; font-size: 24px; font-weight: bold; margin: 0;">Malappuram Nikah</h1>
            <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Pious Muslim Matrimony Service</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #111827; font-size: 16px; margin: 0 0 12px 0;">Assalamu Alaikum ${recipientName},</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
              Thank you for registering with <strong>Malappuram Nikah</strong>. Please use the following 6-digit One Time Password (OTP) to verify your account:
            </p>
            
            <div style="text-align: center; padding: 16px; background-color: #026d77; border-radius: 10px; margin: 20px 0;">
              <span style="color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 6px; font-family: monospace;">${otpCode}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
              This OTP is valid for 10 minutes. Do not share this code with anyone.
            </p>
          </div>

          <div style="border-top: 1px solid #f3f4f6; pt-16px; text-align: center; color: #9ca3af; font-size: 11px;">
            <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} Malappuram Nikah. All rights reserved.</p>
          </div>
        </div>
      `;

      // If no SMTP password configured, log code safely for server environment
      if (!this.emailPass) {
        console.log(`\n==================================================`);
        console.log(`[NODEMAILER DEV LOG] Email: ${toEmail} | OTP: ${otpCode}`);
        console.log(`==================================================\n`);
        return {
          success: true,
          message: `OTP sent to email ${toEmail} (Configure EMAIL_PASS in Render for live inbox delivery)`,
        };
      }

      await transporter.sendMail({
        from: `"Malappuram Nikah" <${this.emailUser}>`,
        to: toEmail,
        subject: `${otpCode} is your Malappuram Nikah Verification Code`,
        html: htmlContent,
      });

      console.log(`[NODEMAILER SUCCESS] OTP sent to ${toEmail}`);
      return { success: true, message: `OTP sent successfully to ${toEmail}` };
    } catch (err: any) {
      console.error("[NODEMAILER ERROR] Failed to send email:", err);
      return { success: false, message: err?.message || "Email service error" };
    }
  }
}
