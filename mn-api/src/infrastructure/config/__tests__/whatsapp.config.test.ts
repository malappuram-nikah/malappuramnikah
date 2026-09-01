import assert from "node:assert";
import {
  getWhatsAppConfig,
  validateWhatsAppConfig,
  getSanitizedWhatsAppConfig,
  WhatsAppConfigError,
} from "../whatsapp.config";

function runTests() {
  console.log("==========================================");
  console.log("Running WhatsApp Configuration Unit Tests");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  const validEnv: Record<string, string> = {
    WHATSAPP_API_VERSION: "v21.0",
    WHATSAPP_PHONE_NUMBER_ID: "123456789012345",
    WHATSAPP_BUSINESS_ACCOUNT_ID: "987654321098765",
    WHATSAPP_ACCESS_TOKEN: "EAA_test_secret_access_token_12345",
    WHATSAPP_APP_SECRET: "test_app_secret_67890",
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: "test_webhook_verify_token_54321",
    WHATSAPP_OTP_TEMPLATE_NAME: "custom_otp_template",
    WHATSAPP_OTP_TEMPLATE_LANGUAGE: "en_US",
  };

  test("Valid configuration loads correctly", () => {
    const config = getWhatsAppConfig(validEnv);
    assert.strictEqual(config.apiVersion, "v21.0");
    assert.strictEqual(config.phoneNumberId, "123456789012345");
    assert.strictEqual(config.businessAccountId, "987654321098765");
    assert.strictEqual(config.accessToken, "EAA_test_secret_access_token_12345");
    assert.strictEqual(config.appSecret, "test_app_secret_67890");
    assert.strictEqual(config.webhookVerifyToken, "test_webhook_verify_token_54321");
    assert.strictEqual(config.otpTemplateName, "custom_otp_template");
    assert.strictEqual(config.otpTemplateLanguage, "en_US");
  });

  test("Applies safe default values for optional fields when omitted", () => {
    const minimalEnv: Record<string, string> = {
      WHATSAPP_PHONE_NUMBER_ID: "123456789012345",
      WHATSAPP_BUSINESS_ACCOUNT_ID: "987654321098765",
      WHATSAPP_ACCESS_TOKEN: "EAA_test_secret_access_token_12345",
      WHATSAPP_APP_SECRET: "test_app_secret_67890",
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: "test_webhook_verify_token_54321",
    };

    const config = getWhatsAppConfig(minimalEnv);
    assert.strictEqual(config.apiVersion, "v21.0");
    assert.strictEqual(config.otpTemplateName, "otp_verification");
    assert.strictEqual(config.otpTemplateLanguage, "en");
  });

  test("Missing required values fail safely with WhatsAppConfigError", () => {
    const incompleteEnv: Record<string, string> = {
      WHATSAPP_API_VERSION: "v21.0",
      WHATSAPP_PHONE_NUMBER_ID: "123456789012345",
      // WHATSAPP_BUSINESS_ACCOUNT_ID is missing
      // WHATSAPP_ACCESS_TOKEN is missing
    };

    const validation = validateWhatsAppConfig(incompleteEnv);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.length >= 2);
    assert.ok(validation.errors.some((e) => e.includes("WHATSAPP_BUSINESS_ACCOUNT_ID")));
    assert.ok(validation.errors.some((e) => e.includes("WHATSAPP_ACCESS_TOKEN")));

    assert.throws(
      () => getWhatsAppConfig(incompleteEnv),
      (err: any) => {
        return err instanceof WhatsAppConfigError && err.errors.length >= 2;
      }
    );
  });

  test("Invalid WHATSAPP_API_VERSION format fails safely", () => {
    const invalidVersionEnv = {
      ...validEnv,
      WHATSAPP_API_VERSION: "invalid_v21",
    };

    const validation = validateWhatsAppConfig(invalidVersionEnv);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes("WHATSAPP_API_VERSION")));
  });

  test("Secrets are never included in error messages or logs", () => {
    const sensitiveEnv: Record<string, string> = {
      WHATSAPP_ACCESS_TOKEN: "SUPER_SECRET_TOKEN_DO_NOT_LOG",
      WHATSAPP_APP_SECRET: "SUPER_SECRET_APP_SECRET",
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: "SUPER_SECRET_VERIFY_TOKEN",
      // missing required phone number and business account id
    };

    const validation = validateWhatsAppConfig(sensitiveEnv);
    const errorString = JSON.stringify(validation.errors);

    assert.strictEqual(errorString.includes("SUPER_SECRET_TOKEN_DO_NOT_LOG"), false);
    assert.strictEqual(errorString.includes("SUPER_SECRET_APP_SECRET"), false);
    assert.strictEqual(errorString.includes("SUPER_SECRET_VERIFY_TOKEN"), false);
  });

  test("Sanitized config redacts sensitive credentials", () => {
    const config = getWhatsAppConfig(validEnv);
    const sanitized = getSanitizedWhatsAppConfig(config);

    assert.strictEqual(sanitized.accessToken, "[REDACTED]");
    assert.strictEqual(sanitized.appSecret, "[REDACTED]");
    assert.strictEqual(sanitized.webhookVerifyToken, "[REDACTED]");
    assert.strictEqual(sanitized.phoneNumberId, "123456789012345");
    assert.strictEqual(sanitized.businessAccountId, "987654321098765");
  });

  test("Client-side bundles cannot access WhatsApp credentials (no NEXT_PUBLIC_ exposure)", () => {
    const publicKeys = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_WHATSAPP"));
    assert.strictEqual(publicKeys.length, 0, "Found forbidden NEXT_PUBLIC_WHATSAPP_ credentials in environment!");
  });

  console.log("------------------------------------------");
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
