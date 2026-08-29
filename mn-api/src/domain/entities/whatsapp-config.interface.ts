export interface WhatsAppConfig {
  apiVersion: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  appSecret: string;
  webhookVerifyToken: string;
  otpTemplateName: string;
  otpTemplateLanguage: string;
}

export interface SanitizedWhatsAppConfig {
  apiVersion: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  appSecret: string;
  webhookVerifyToken: string;
  otpTemplateName: string;
  otpTemplateLanguage: string;
}
