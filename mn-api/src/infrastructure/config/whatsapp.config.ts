import { WhatsAppConfig, SanitizedWhatsAppConfig } from "../../domain/entities/whatsapp-config.interface";

export class WhatsAppConfigError extends Error {
  public readonly errors: string[];

  constructor(errors: string[]) {
    super(`WhatsApp Configuration Error:\n- ${errors.join("\n- ")}`);
    this.name = "WhatsAppConfigError";
    this.errors = errors;
    Object.setPrototypeOf(this, WhatsAppConfigError.prototype);
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  config?: WhatsAppConfig;
}

const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_OTP_TEMPLATE_NAME = "otp_verification";
const DEFAULT_OTP_TEMPLATE_LANGUAGE = "en_US";

/**
 * Validates the WhatsApp environment variables and returns a validation result.
 * Never includes raw secret values in error messages.
 */
export function validateWhatsAppConfig(
  envSource: Record<string, string | undefined> = process.env
): ValidationResult {
  const errors: string[] = [];

  const apiVersion = (envSource.WHATSAPP_API_VERSION || DEFAULT_API_VERSION).trim();
  const phoneNumberId = (envSource.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const businessAccountId = (envSource.WHATSAPP_BUSINESS_ACCOUNT_ID || "").trim();
  const accessToken = (envSource.WHATSAPP_ACCESS_TOKEN || "").trim();
  const appSecret = (envSource.WHATSAPP_APP_SECRET || "").trim();
  const webhookVerifyToken = (envSource.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "").trim();
  const otpTemplateName = (envSource.WHATSAPP_OTP_TEMPLATE_NAME || DEFAULT_OTP_TEMPLATE_NAME).trim();
  const otpTemplateLanguage = (envSource.WHATSAPP_OTP_TEMPLATE_LANGUAGE || DEFAULT_OTP_TEMPLATE_LANGUAGE).trim();

  // Validate API Version format (e.g. v21.0, v18.0)
  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    errors.push(`WHATSAPP_API_VERSION must be in format 'vX.Y' (e.g. 'v21.0'). Received: '${apiVersion}'`);
  }

  if (!phoneNumberId) {
    errors.push("WHATSAPP_PHONE_NUMBER_ID is required.");
  }

  if (!businessAccountId) {
    errors.push("WHATSAPP_BUSINESS_ACCOUNT_ID is required.");
  }

  if (!accessToken) {
    errors.push("WHATSAPP_ACCESS_TOKEN is required.");
  }

  if (!appSecret) {
    errors.push("WHATSAPP_APP_SECRET is required.");
  }

  if (!webhookVerifyToken) {
    errors.push("WHATSAPP_WEBHOOK_VERIFY_TOKEN is required.");
  }

  if (!otpTemplateName) {
    errors.push("WHATSAPP_OTP_TEMPLATE_NAME cannot be empty.");
  }

  if (!otpTemplateLanguage) {
    errors.push("WHATSAPP_OTP_TEMPLATE_LANGUAGE cannot be empty.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const config: WhatsAppConfig = Object.freeze({
    apiVersion,
    phoneNumberId,
    businessAccountId,
    accessToken,
    appSecret,
    webhookVerifyToken,
    otpTemplateName,
    otpTemplateLanguage,
  });

  return { valid: true, errors: [], config };
}

/**
 * Loads and returns a strongly-typed, frozen WhatsAppConfig object.
 * Throws a WhatsAppConfigError if validation fails.
 */
export function getWhatsAppConfig(
  envSource: Record<string, string | undefined> = process.env
): WhatsAppConfig {
  const result = validateWhatsAppConfig(envSource);
  if (!result.valid || !result.config) {
    throw new WhatsAppConfigError(result.errors);
  }
  return result.config;
}

/**
 * Returns a sanitized copy of WhatsAppConfig with all sensitive secrets redacted.
 * Safe for logging and health checks.
 */
export function getSanitizedWhatsAppConfig(config: WhatsAppConfig): SanitizedWhatsAppConfig {
  return {
    ...config,
    accessToken: "[REDACTED]",
    appSecret: "[REDACTED]",
    webhookVerifyToken: "[REDACTED]",
  };
}
