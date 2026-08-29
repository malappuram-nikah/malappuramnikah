import assert from "node:assert";
import { EmailOtpProvider } from "../EmailOtpProvider";
import { OtpDeliveryResolver, OtpDeliveryError } from "../OtpDeliveryResolver";

async function runTests() {
  console.log("==========================================");
  console.log("Running EmailOtpProvider & Resolver Unit Tests");
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

  await test("1. EmailOtpProvider: Has correct channel property", async () => {
    const provider = new EmailOtpProvider();
    assert.strictEqual(provider.channel, "EMAIL");
  });

  await test("2. EmailOtpProvider: Successfully dispatches sendOtp request", async () => {
    const provider = new EmailOtpProvider();
    const result = await provider.sendOtp({
      recipient: "test_delivery@example.com",
      otpCode: "654321",
      name: "Delivery Tester",
      purpose: "VERIFICATION",
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provider, "EmailOtpService");
  });

  await test("3. OtpDeliveryResolver: Resolves EMAIL to EmailOtpProvider instance", async () => {
    const provider = OtpDeliveryResolver.resolveProvider("EMAIL");
    assert.ok(provider);
    assert.strictEqual(provider.channel, "EMAIL");
  });

  await test("4. OtpDeliveryResolver: Returns clear unconfigured error for WHATSAPP (Module 4.3 placeholder)", async () => {
    assert.throws(
      () => {
        OtpDeliveryResolver.resolveProvider("WHATSAPP");
      },
      (err: any) => {
        assert.ok(err instanceof OtpDeliveryError);
        assert.strictEqual(err.statusCode, 503);
        assert.ok(err.message.includes("Module 4.3"));
        return true;
      }
    );
  });

  await test("5. OtpDeliveryResolver: Defaults to EMAIL when channel is omitted", async () => {
    const provider = OtpDeliveryResolver.resolveProvider();
    assert.ok(provider);
    assert.strictEqual(provider.channel, "EMAIL");
  });

  console.log("------------------------------------------");
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
