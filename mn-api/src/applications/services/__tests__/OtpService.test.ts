import assert from "node:assert";
import { OtpService } from "../OtpService";
import { OtpRepository } from "../../../infrastructure/repositories/OtpRepository";
import prisma from "../../../infrastructure/prisma/prisamClient";

async function runTests() {
  console.log("==========================================");
  console.log("Running OtpService Unit Tests");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  const testUserEmail = `test_otp_user_${Date.now()}@example.com`;
  const testUserMobile = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  let testUserId: number;

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

  // Helper setup: Create test user
  const user = await prisma.user.create({
    data: {
      first_name: "OTP",
      last_name: "Tester",
      email: testUserEmail,
      mobile_number: testUserMobile,
      password: "hashed_password_123",
      dob: "1995-05-15",
      gender: "Male",
      cast: "Sunni",
      location: "Malappuram",
      profile_for: "Myself",
      status: "in_active",
    },
  });
  testUserId = user.id;

  try {
    await test("1. Generation: Generates 6-digit numeric CSPRNG code", async () => {
      const code = OtpService.generateNumericOtp(6);
      assert.strictEqual(code.length, 6);
      assert.ok(/^\d{6}$/.test(code), "Code must consist of exactly 6 numeric digits");
    });

    await test("2. Storage: Hashed OTP is stored in database; Plaintext is never saved", async () => {
      const req = await OtpService.requestOtp({
        targetIdentifier: testUserEmail,
        channel: "EMAIL",
        purpose: "VERIFICATION",
      });

      assert.strictEqual(req.success, true);
      assert.ok(req.otpCode);

      const record = await prisma.verify.findFirst({
        where: { user_id: testUserId, is_verified: false },
        orderBy: { created_at: "desc" },
      });

      assert.ok(record);
      assert.notStrictEqual(record.otp_code, req.otpCode, "Database must NOT contain plaintext OTP!");
      const expectedHash = OtpService.hashOtp(req.otpCode);
      assert.strictEqual(record.otp_code, expectedHash, "Database must contain SHA-256 hashed OTP");
    });

    await test("3. Verification: Correct OTP succeeds and consumes record (Single-Use)", async () => {
      // Clear previous records for clean test
      await prisma.verify.deleteMany({ where: { user_id: testUserId } });

      const req = await OtpService.requestOtp({
        targetIdentifier: testUserEmail,
        channel: "EMAIL",
        purpose: "VERIFICATION",
      });

      assert.ok(req.otpCode);

      const verifyResult = await OtpService.verifyOtp({
        targetIdentifier: testUserEmail,
        otpCode: req.otpCode,
        channel: "EMAIL",
        purpose: "VERIFICATION",
      });

      assert.strictEqual(verifyResult.valid, true);

      // Verify single-use consumption (record deleted)
      const afterRecord = await prisma.verify.findFirst({
        where: { user_id: testUserId, is_verified: false },
      });
      assert.strictEqual(afterRecord, null, "Record must be deleted/consumed after successful verification");

      // Verify re-use attempt fails
      const reuseResult = await OtpService.verifyOtp({
        targetIdentifier: testUserEmail,
        otpCode: req.otpCode,
        channel: "EMAIL",
        purpose: "VERIFICATION",
      });
      assert.strictEqual(reuseResult.valid, false, "Used OTP must not be reusable");
    });

    await test("4. Legacy Plaintext Matching: Verification supports pre-existing plaintext rows", async () => {
      await prisma.verify.deleteMany({ where: { user_id: testUserId } });

      // Insert legacy plaintext OTP row
      const legacyOtp = "654321";
      await prisma.verify.create({
        data: {
          user_id: testUserId,
          otp_code: legacyOtp, // Plaintext legacy format
          channel: "EMAIL",
          purpose: "VERIFICATION",
          attempts: 0,
          expires_at: new Date(Date.now() + 600000),
          is_verified: false,
        },
      });

      const verifyResult = await OtpService.verifyOtp({
        targetIdentifier: testUserEmail,
        otpCode: legacyOtp,
        channel: "EMAIL",
        purpose: "VERIFICATION",
      });

      assert.strictEqual(verifyResult.valid, true, "Legacy plaintext OTP must match successfully");
    });

    await test("5. Attempt Limits: Increments counter and invalidates OTP after 5 failed attempts", async () => {
      await prisma.verify.deleteMany({ where: { user_id: testUserId } });

      const req = await OtpService.requestOtp({
        targetIdentifier: testUserEmail,
        channel: "EMAIL",
        purpose: "VERIFICATION",
      });
      assert.ok(req.otpCode);

      // Perform 4 wrong attempts
      for (let i = 1; i <= 4; i++) {
        const result = await OtpService.verifyOtp({
          targetIdentifier: testUserEmail,
          otpCode: "000000",
          channel: "EMAIL",
          purpose: "VERIFICATION",
          maxAttempts: 5,
        });
        assert.strictEqual(result.valid, false);
      }

      // Check attempt count in DB
      const record = await prisma.verify.findFirst({
        where: { user_id: testUserId, is_verified: false },
      });
      assert.ok(record);
      assert.strictEqual(record.attempts, 4);

      // Perform 5th wrong attempt -> Should invalidate OTP record
      const result5 = await OtpService.verifyOtp({
        targetIdentifier: testUserEmail,
        otpCode: "000000",
        channel: "EMAIL",
        purpose: "VERIFICATION",
        maxAttempts: 5,
      });
      assert.strictEqual(result5.valid, false);
      assert.strictEqual(result5.attemptsExceeded, true);

      // Verify OTP record is deleted/invalidated
      const recordAfter5 = await prisma.verify.findFirst({
        where: { user_id: testUserId, is_verified: false },
      });
      assert.strictEqual(recordAfter5, null, "Record must be deleted after 5 failed attempts");
    });

    await test("6. Resend Protection: Enforces 60-second cooldown", async () => {
      await prisma.verify.deleteMany({ where: { user_id: testUserId } });

      // First request
      const req1 = await OtpService.requestOtp({
        targetIdentifier: testUserEmail,
        channel: "EMAIL",
        purpose: "VERIFICATION",
        cooldownSeconds: 60,
      });
      assert.strictEqual(req1.success, true);

      // Immediate second request (should fail due to 60s cooldown)
      const req2 = await OtpService.requestOtp({
        targetIdentifier: testUserEmail,
        channel: "EMAIL",
        purpose: "VERIFICATION",
        cooldownSeconds: 60,
      });

      assert.strictEqual(req2.success, false);
      assert.ok(req2.message.includes("wait"), "Cooldown error message must instruct user to wait");
    });

    await test("7. Expiration: Rejects expired OTP", async () => {
      await prisma.verify.deleteMany({ where: { user_id: testUserId } });

      const expiredAt = new Date(Date.now() - 1000); // 1 sec in the past
      await prisma.verify.create({
        data: {
          user_id: testUserId,
          otp_code: OtpService.hashOtp("112233"),
          channel: "EMAIL",
          purpose: "VERIFICATION",
          attempts: 0,
          expires_at: expiredAt,
          is_verified: false,
        },
      });

      const result = await OtpService.verifyOtp({
        targetIdentifier: testUserEmail,
        otpCode: "112233",
        channel: "EMAIL",
        purpose: "VERIFICATION",
      });

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.expired, true);
    });
  } finally {
    // Cleanup test user and OTP records
    await prisma.verify.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  }

  console.log("------------------------------------------");
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
