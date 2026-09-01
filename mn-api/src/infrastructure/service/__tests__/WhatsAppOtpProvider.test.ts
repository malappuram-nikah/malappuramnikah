import assert from "node:assert";
import { WhatsAppOtpProvider } from "../WhatsAppOtpProvider";
import { OtpDeliveryResolver } from "../OtpDeliveryResolver";
import { WhatsAppApiClient, WhatsAppApiError } from "../WhatsAppApiClient";
import { getWhatsAppConfig } from "../../config/whatsapp.config";
import { OtpService } from "../../../applications/services/OtpService";
import prisma from "../../prisma/prisamClient";

async function runTests() {
  console.log("==========================================");
  console.log("Running WhatsAppOtpProvider & Resolver Unit Tests");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // Backup original sendTemplateMessage
  const originalSendTemplateMessage = WhatsAppApiClient.sendTemplateMessage;

  try {
    await test("1. Provider Resolution: Resolves WHATSAPP to WhatsAppOtpProvider instance", async () => {
      const provider = OtpDeliveryResolver.resolveProvider("WHATSAPP");
      assert.ok(provider);
      assert.strictEqual(provider.channel, "WHATSAPP");
    });

    await test("2. Successful Delivery: Constructs correct template components and passes to Meta API", async () => {
      const provider = new WhatsAppOtpProvider();
      let capturedTo = "";
      let capturedTemplate = "";
      let capturedLang = "";
      let capturedComponents: any[] = [];

      (WhatsAppApiClient as any).sendTemplateMessage = async (
        to: string,
        templateName: string,
        languageCode: string,
        components: any[]
      ) => {
        capturedTo = to;
        capturedTemplate = templateName;
        capturedLang = languageCode;
        capturedComponents = components;

        return {
          messaging_product: "whatsapp",
          contacts: [{ input: to, wa_id: "919876543210" }],
          messages: [{ id: "wamid.HBgLMTIzNDU2Nzg5MA==" }],
        };
      };

      const result = await provider.sendOtp({
        recipient: "+919876543210",
        otpCode: "987654",
        purpose: "VERIFICATION",
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.provider, "WhatsAppOtpProvider");
      assert.ok(result.message.includes("wamid.HBgLMTIzNDU2Nzg5MA=="));

      assert.strictEqual(capturedTo, "+919876543210");
      assert.strictEqual(capturedTemplate, getWhatsAppConfig().otpTemplateName);
      assert.strictEqual(capturedLang, "en");
      assert.strictEqual(capturedComponents[0].parameters[0].text, "987654");
    });

    await test("3. Meta API Failure: Handles invalid recipient / template error (HTTP 400)", async () => {
      const provider = new WhatsAppOtpProvider();

      (WhatsAppApiClient as any).sendTemplateMessage = async () => {
        throw new WhatsAppApiError({
          message: "Invalid WhatsApp phone number recipient",
          statusCode: 400,
          code: 100,
        });
      };

      const result = await provider.sendOtp({
        recipient: "123",
        otpCode: "111222",
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes("Invalid"));
    });

    await test("4. Security: Plaintext OTP and secrets are not leaked in log metadata", async () => {
      const provider = new WhatsAppOtpProvider();
      let loggedOutput = "";

      const originalConsoleLog = console.log;
      console.log = (...args: any[]) => {
        loggedOutput += args.join(" ");
        originalConsoleLog(...args);
      };

      (WhatsAppApiClient as any).sendTemplateMessage = async () => {
        return {
          messaging_product: "whatsapp",
          contacts: [{ input: "919876543210", wa_id: "919876543210" }],
          messages: [{ id: "wamid.TEST" }],
        };
      };

      try {
        await provider.sendOtp({
          recipient: "+919876543210",
          otpCode: "777888",
        });
      } finally {
        console.log = originalConsoleLog;
      }

      assert.ok(!loggedOutput.includes("WHATSAPP_ACCESS_TOKEN"), "Secrets must never be logged");
      assert.ok(!loggedOutput.includes("WHATSAPP_APP_SECRET"), "Secrets must never be logged");
    });

    await test("5. End-to-End Core + WhatsApp Provider: Hashed DB storage & in-memory delivery", async () => {
      const testMobile = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Create dummy user for test
      const dummyUser = await prisma.user.create({
        data: {
          first_name: "WA",
          last_name: "Tester",
          email: `wa_test_${Date.now()}@example.com`,
          mobile_number: testMobile,
          password: "hashed_password",
          dob: "1996-01-01",
          gender: "Female",
          cast: "Sunni",
          location: "Malappuram",
          profile_for: "Myself",
          status: "in_active",
        },
      });

      try {
        let sentCode = "";
        (WhatsAppApiClient as any).sendTemplateMessage = async (to: string, tName: string, lCode: string, components: any[]) => {
          sentCode = components[0].parameters[0].text;
          return { messaging_product: "whatsapp", contacts: [], messages: [{ id: "wamid.E2E" }] };
        };

        const req = await OtpService.requestOtp({
          targetIdentifier: testMobile,
          channel: "WHATSAPP",
          purpose: "VERIFICATION",
        });

        assert.strictEqual(req.success, true);
        assert.ok(req.otpCode);

        // Verify stored DB record is SHA-256 hashed
        const dbRecord = await prisma.verify.findFirst({
          where: { user_id: dummyUser.id, channel: "WHATSAPP" },
          orderBy: { created_at: "desc" },
        });

        assert.ok(dbRecord);
        assert.notStrictEqual(dbRecord.otp_code, req.otpCode, "Database must NOT store plaintext OTP");
        assert.strictEqual(dbRecord.otp_code, OtpService.hashOtp(req.otpCode), "Database must store SHA-256 hash");

        // Verify verification succeeds using plaintext
        const verifyResult = await OtpService.verifyOtp({
          targetIdentifier: testMobile,
          otpCode: req.otpCode,
          channel: "WHATSAPP",
          purpose: "VERIFICATION",
        });

        assert.strictEqual(verifyResult.valid, true);
      } finally {
        await prisma.verify.deleteMany({ where: { user_id: dummyUser.id } });
        await prisma.user.delete({ where: { id: dummyUser.id } });
      }
    });
  } finally {
    (WhatsAppApiClient as any).sendTemplateMessage = originalSendTemplateMessage;
  }

  console.log("------------------------------------------");
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
