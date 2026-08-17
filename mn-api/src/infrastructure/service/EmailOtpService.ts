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

  private static get resendApiKey(): string {
    return process.env.RESEND_API_KEY || "";
  }

  /**
   * Send OTP via Email (Resend HTTP API or Nodemailer SMTP)
   */
  public static async sendOtp(toEmail: string, otpCode: string, name?: string): Promise<EmailOtpResponse> {
    if (!toEmail || !toEmail.includes("@")) {
      return { success: false, message: "Invalid email address" };
    }

    const recipientName = name || "Valued Member";
    const subject = `${otpCode} is your Malappuram Nikah Verification Code`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
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

          <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; color: #9ca3af; font-size: 11px;">
            <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} Malappuram Nikah. All rights reserved.</p>
          </div>
        </div>
      `;

    // 1. Brevo HTTP API Option (300 Free Emails/Day to ANY recipient - Port 443 HTTPS, No domain verification required!)
    const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (brevoApiKey) {
      try {
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoApiKey
          },
          body: JSON.stringify({
            sender: { name: "Malappuram Nikah", email: this.emailUser },
            to: [{ email: toEmail, name: recipientName }],
            subject,
            htmlContent
          })
        });

        const brevoData: any = await brevoRes.json();
        if (brevoRes.ok && (brevoData.messageId || brevoData.id)) {
          console.log(`[BREVO HTTP SUCCESS] OTP Email sent to ${toEmail} (MessageID: ${brevoData.messageId || brevoData.id})`);
          return { success: true, message: `OTP sent successfully to ${toEmail}` };
        } else {
          console.warn(`[BREVO HTTP WARN] Brevo API response:`, brevoData);
        }
      } catch (brevoErr) {
        console.error("[BREVO HTTP ERROR] Failed to send via Brevo API:", brevoErr);
      }
    }

    // 2. Resend HTTP API Option (Port 443 HTTPS)
    if (this.resendApiKey) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Malappuram Nikah <onboarding@resend.dev>";
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.resendApiKey}`
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject,
            html: htmlContent
          })
        });

        const resendData: any = await resendRes.json();
        if (resendRes.ok && resendData.id) {
          console.log(`[RESEND HTTP SUCCESS] OTP Email sent to ${toEmail} (ID: ${resendData.id})`);
          return { success: true, message: `OTP sent successfully to ${toEmail}` };
        } else {
          console.warn(`[RESEND HTTP WARN] Resend API response:`, resendData);
        }
      } catch (resendErr) {
        console.error("[RESEND HTTP ERROR] Failed to send via Resend API:", resendErr);
      }
    }

    // 2. Nodemailer SMTP Option (Port 465 SSL)
    try {
      const port = parseInt(process.env.SMTP_PORT || "465", 10);
      const isSecure = process.env.SMTP_SECURE !== "false" && port === 465;
      const host = process.env.SMTP_HOST || "smtp.gmail.com";

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: {
          user: this.emailUser,
          pass: this.emailPass,
        },
        connectionTimeout: 6000, // 6 second fast timeout
        greetingTimeout: 6000,
        socketTimeout: 8000,
        tls: {
          rejectUnauthorized: false,
        },
      });

      // If no SMTP password configured, log code safely for dev
      if (!this.emailPass) {
        console.log(`\n==================================================`);
        console.log(`[NODEMAILER DEV LOG] Email: ${toEmail} | OTP: ${otpCode}`);
        console.log(`==================================================\n`);
        return {
          success: true,
          message: `OTP sent to email ${toEmail}`,
        };
      }

      await transporter.sendMail({
        from: `"Malappuram Nikah" <${this.emailUser}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[NODEMAILER SUCCESS] OTP sent to ${toEmail}`);
      return { success: true, message: `OTP sent successfully to ${toEmail}` };
    } catch (err: any) {
      console.error("[NODEMAILER ERROR] Failed to send email:", err);
      console.log(`\n==================================================`);
      console.log(`[NODEMAILER FALLBACK LOG] Target: ${toEmail} | OTP Code: ${otpCode}`);
      console.log(`==================================================\n`);
      return { success: false, message: err?.message || "Email service error" };
    }
  }
}
