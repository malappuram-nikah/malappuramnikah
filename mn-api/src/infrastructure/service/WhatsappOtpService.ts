export interface WhatsappOtpResponse {
  success: boolean;
  message: string;
}

export class WhatsappOtpService {
  private static get metaAccessToken(): string {
    return process.env.META_WA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || "";
  }

  private static get metaPhoneNumberId(): string {
    return process.env.META_WA_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID || "";
  }

  private static get metaTemplateName(): string {
    return process.env.META_WA_TEMPLATE_NAME || "otp_verification";
  }

  private static get msg91AuthKey(): string {
    return process.env.MSG91_AUTH_KEY || process.env.MSG90_AUTH_KEY || "";
  }

  private static get msg91TemplateId(): string {
    return process.env.MSG91_TEMPLATE_ID || process.env.MSG91_FLOW_ID || "";
  }

  private static get ultraMsgInstanceId(): string {
    return process.env.ULTRAMSG_INSTANCE_ID || "";
  }

  private static get ultraMsgToken(): string {
    return process.env.ULTRAMSG_TOKEN || "";
  }

  /**
   * Format phone number to clean digits with country code
   * Example: "+919876543210" -> "919876543210"
   * Example: "9876543210" -> "919876543210"
   */
  private static formatPhoneNumber(mobile: string): string {
    let cleaned = mobile.replace(/[^0-9]/g, "");
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Send WhatsApp OTP using MSG91, UltraMsg, Meta API, or Dev Fallback
   */
  public static async sendOtp(mobileNumber: string, otpCode: string): Promise<WhatsappOtpResponse> {
    const formattedPhone = this.formatPhoneNumber(mobileNumber);

    // 1. MSG91 Option (Priority)
    if (this.msg91AuthKey && this.msg91TemplateId) {
      return this.sendViaMsg91(formattedPhone, otpCode);
    }

    // 2. Meta WhatsApp Cloud API Option
    if (this.metaAccessToken && this.metaPhoneNumberId) {
      return this.sendViaMetaCloudApi(formattedPhone, otpCode);
    }

    // 3. Dev / Mock Mode Fallback
    console.log(`\n==================================================`);
    console.log(`[WHATSAPP DEV MODE] Phone: +${formattedPhone} | OTP: ${otpCode}`);
    console.log(`==================================================\n`);

    return {
      success: true,
      message: `[DEV MODE] WhatsApp OTP for +${formattedPhone}: ${otpCode}`,
    };
  }

  /**
   * Send OTP via MSG91 API (WhatsApp / SMS channel)
   */
  private static async sendViaMsg91(phone: string, otpCode: string): Promise<WhatsappOtpResponse> {
    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${this.msg91TemplateId}&mobile=${phone}&otp=${otpCode}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          authkey: this.msg91AuthKey,
          "Content-Type": "application/json",
        },
      });

      const data: any = await response.json();

      if (response.ok && (data?.type === "success" || data?.message?.includes("success"))) {
        console.log(`[WHATSAPP MSG91 SUCCESS] OTP sent to +${phone}:`, data);
        return { success: true, message: "WhatsApp OTP sent successfully via MSG91" };
      } else {
        console.warn(`[WHATSAPP MSG91 RESPONSE] Error response for +${phone}:`, data);
        return {
          success: false,
          message: data?.message || "Failed to send WhatsApp OTP via MSG91",
        };
      }
    } catch (error: any) {
      console.error(`[WHATSAPP MSG91 ERROR] Failed for +${phone}:`, error?.message || error);
      return {
        success: false,
        message: error?.message || "MSG91 service unavailable",
      };
    }
  }

  /**
   * Send OTP via Meta WhatsApp Cloud API (v21.0)
   */
  private static async sendViaMetaCloudApi(phone: string, otpCode: string): Promise<WhatsappOtpResponse> {
    try {
      const url = `https://graph.facebook.com/v21.0/${this.metaPhoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: this.metaTemplateName,
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: otpCode,
                  },
                ],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                  {
                    type: "text",
                    text: otpCode,
                  },
                ],
              },
            ],
          },
        }),
      });

      const data: any = await response.json();

      if (response.ok && data?.messages?.[0]?.id) {
        console.log(`[WHATSAPP META SUCCESS] OTP sent to +${phone}:`, data);
        return { success: true, message: "WhatsApp OTP sent successfully via Meta" };
      } else {
        console.warn(`[WHATSAPP META RESPONSE] Error response for +${phone}:`, data);
        return {
          success: false,
          message: data?.error?.message || "Failed to send WhatsApp OTP via Meta",
        };
      }
    } catch (error: any) {
      console.error(`[WHATSAPP META ERROR] Failed for +${phone}:`, error?.message || error);
      return {
        success: false,
        message: error?.message || "WhatsApp service unavailable",
      };
    }
  }

  /**
   * Send OTP via UltraMsg API
   */
  private static async sendViaUltraMsg(phone: string, otpCode: string): Promise<WhatsappOtpResponse> {
    try {
      const url = `https://api.ultramsg.com/${this.ultraMsgInstanceId}/messages/chat`;
      const messageBody = `Your Malappuram Nikah verification OTP code is: *${otpCode}*. Valid for 10 minutes. Do not share this code with anyone.`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token: this.ultraMsgToken,
          to: `+${phone}`,
          body: messageBody,
        }),
      });

      const data: any = await response.json();

      if (response.ok && (data?.sent === "true" || data?.id)) {
        console.log(`[WHATSAPP ULTRAMSG SUCCESS] OTP sent to +${phone}:`, data);
        return { success: true, message: "WhatsApp OTP sent successfully via UltraMsg" };
      } else {
        console.warn(`[WHATSAPP ULTRAMSG RESPONSE] Error response for +${phone}:`, data);
        return {
          success: false,
          message: data?.error || "Failed to send WhatsApp OTP via UltraMsg",
        };
      }
    } catch (error: any) {
      console.error(`[WHATSAPP ULTRAMSG ERROR] Failed for +${phone}:`, error?.message || error);
      return {
        success: false,
        message: error?.message || "WhatsApp service unavailable",
      };
    }
  }
}
