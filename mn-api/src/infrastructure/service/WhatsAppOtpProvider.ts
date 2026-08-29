import { IOtpDeliveryProvider, SendOtpDeliveryInput, SendOtpDeliveryResult } from "../../domain/interfaces/IOtpDeliveryProvider.interface";
import { WhatsAppApiClient, WhatsAppApiError } from "./WhatsAppApiClient";
import { getWhatsAppConfig } from "../config/whatsapp.config";
import { WhatsAppTemplateComponent } from "../../domain/entities/whatsapp-client.interface";

export class WhatsAppOtpProvider implements IOtpDeliveryProvider {
  public readonly channel: string = "WHATSAPP";

  async sendOtp(input: SendOtpDeliveryInput): Promise<SendOtpDeliveryResult> {
    const { recipient, otpCode } = input;

    if (!recipient || recipient.trim().length < 8) {
      return {
        success: false,
        message: "Invalid WhatsApp recipient mobile number.",
        provider: "WhatsAppOtpProvider",
      };
    }

    try {
      const config = getWhatsAppConfig();
      const templateName = config.otpTemplateName;
      const languageCode = config.otpTemplateLanguage;

      const components: WhatsAppTemplateComponent[] = [
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
      ];

      const formattedPhone = WhatsAppApiClient.formatPhoneNumber(recipient);
      const maskedPhone = formattedPhone.length >= 8
        ? formattedPhone.replace(/^(\d{2,4})\d+(\d{2})$/, "$1****$2")
        : "****";

      console.log(`[WHATSAPP OTP PROVIDER] Dispatching OTP via Meta Cloud API to ${maskedPhone} (template=${templateName}, lang=${languageCode})`);

      const response = await WhatsAppApiClient.sendTemplateMessage(
        recipient,
        templateName,
        languageCode,
        components
      );

      const messageId = response.messages?.[0]?.id || "accepted";
      return {
        success: true,
        message: `WhatsApp OTP message sent successfully (ID: ${messageId}).`,
        provider: "WhatsAppOtpProvider",
      };
    } catch (err: any) {
      const errorMessage = err instanceof WhatsAppApiError
        ? `WhatsApp API delivery failed: ${err.message}`
        : (err?.message || "WhatsApp OTP delivery failed");

      console.error(`[WHATSAPP OTP PROVIDER ERROR] ${errorMessage}`);

      return {
        success: false,
        message: errorMessage,
        provider: "WhatsAppOtpProvider",
      };
    }
  }
}
