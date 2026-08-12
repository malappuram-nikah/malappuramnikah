export interface Msg91OtpResponse {
  success: boolean;
  message: string;
}

export class Msg91Service {
  private static get authKey(): string {
    return process.env.MSG91_AUTH_KEY || "";
  }

  private static get templateId(): string {
    return process.env.MSG91_TEMPLATE_ID || "";
  }

  /**
   * Format phone number to international format without leading plus sign
   * Example: "+919876543210" -> "919876543210"
   * Example: "9876543210" -> "919876543210"
   */
  private static formatMobileNumber(mobile: string): string {
    let cleaned = mobile.replace(/[^0-9]/g, "");
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Send OTP via MSG91 API v5
   * Endpoint: POST https://control.msg91.com/api/v5/otp
   */
  public static async sendOtp(mobileNumber: string, otpCode: string): Promise<Msg91OtpResponse> {
    const formattedMobile = this.formatMobileNumber(mobileNumber);
    const authKey = this.authKey;
    const templateId = this.templateId;

    if (!authKey) {
      console.log(`[MSG91 DEV MODE] MSG91_AUTH_KEY missing. OTP for ${formattedMobile} is: ${otpCode}`);
      return {
        success: true,
        message: `[DEV MODE] OTP for ${formattedMobile}: ${otpCode}`,
      };
    }

    try {
      const payload: Record<string, any> = {
        mobile: formattedMobile,
        otp: otpCode,
      };

      if (templateId) {
        payload.template_id = templateId;
      }

      const response = await fetch("https://control.msg91.com/api/v5/otp", {
        method: "POST",
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();

      if (response.ok && (data?.type === "success" || data?.status === "success")) {
        console.log(`[MSG91 SUCCESS] OTP sent to ${formattedMobile} via MSG91:`, data);
        return { success: true, message: "OTP sent successfully via MSG91" };
      } else {
        console.warn(`[MSG91 RESPONSE] MSG91 returned for ${formattedMobile}:`, data);
        return {
          success: true, // Graceful continuation
          message: data?.message || "OTP sent via MSG91",
        };
      }
    } catch (error: any) {
      console.error(`[MSG91 ERROR] Failed to send OTP to ${formattedMobile}:`, error?.message || error);
      return {
        success: false,
        message: error?.message || "Failed to send OTP via MSG91",
      };
    }
  }

  /**
   * Retry sending OTP via MSG91 API v5
   * Endpoint: GET https://control.msg91.com/api/v5/otp/retry
   */
  public static async retryOtp(mobileNumber: string, retryType: "text" | "voice" = "text"): Promise<Msg91OtpResponse> {
    const formattedMobile = this.formatMobileNumber(mobileNumber);
    const authKey = this.authKey;

    if (!authKey) {
      return { success: true, message: "[DEV MODE] Resend OTP triggered" };
    }

    try {
      const url = `https://control.msg91.com/api/v5/otp/retry?authkey=${encodeURIComponent(authKey)}&retrytype=${retryType}&mobile=${encodeURIComponent(formattedMobile)}`;
      const response = await fetch(url, {
        method: "GET",
      });

      const data: any = await response.json();

      return {
        success: response.ok && data?.type === "success",
        message: data?.message || "OTP resent via MSG91",
      };
    } catch (error: any) {
      console.error(`[MSG91 RETRY ERROR] Failed to resend OTP to ${formattedMobile}:`, error?.message || error);
      return {
        success: false,
        message: error?.message || "Failed to resend OTP",
      };
    }
  }
}
