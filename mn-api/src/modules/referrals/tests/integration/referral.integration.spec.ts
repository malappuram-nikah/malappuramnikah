import request from "supertest";
import app from "../../../../app";
import { generateToken } from "../../../../shared/auth/jwt.util";
import prisma from "../../../../shared/database/prisma";

describe("Referrals Module - Integration Tests", () => {
  let referrerId: number;
  let referredId: number;
  let token1: string;
  let token2: string;
  let referralCode: string;

  beforeAll(async () => {
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "Referrer",
        last_name: "One",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876571111",
        password: "hashedpassword123",
        status: "ACTIVE",
        referral_points: 0,
      },
    });
    referrerId = u1.id;
    token1 = generateToken({ userId: referrerId, mobileNumber: u1.mobile_number, isAdmin: false });

    const u2 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "Referred",
        last_name: "Two",
        dob: "1993-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876572222",
        password: "hashedpassword123",
        status: "ACTIVE",
        referral_points: 0,
      },
    });
    referredId = u2.id;
    token2 = generateToken({ userId: referredId, mobileNumber: u2.mobile_number, isAdmin: false });
  });

  afterAll(async () => {
    await prisma.referralTransaction.deleteMany({ where: { OR: [{ user_id: referrerId }, { user_id: referredId }] } });
    await prisma.referral.deleteMany({ where: { OR: [{ referrer_id: referrerId }, { referred_user_id: referrerId }] } });
    await prisma.user.deleteMany({ where: { id: { in: [referrerId, referredId] } } });
  });

  it("should complete referral code generation -> application -> reward -> redemption flow", async () => {
    // 1. Generate code for Referrer
    const codeRes = await request(app)
      .get("/referral/my-code")
      .set("Authorization", `Bearer ${token1}`);

    expect(codeRes.status).toBe(200);
    expect(codeRes.body.referralCode).toBeDefined();
    referralCode = codeRes.body.referralCode;

    // 2. Validate referral code
    const validRes = await request(app)
      .get("/referral/validate")
      .query({ code: referralCode });

    expect(validRes.status).toBe(200);
    expect(validRes.body.valid).toBe(true);

    // 3. Apply referral code by Referred User
    const applyRes = await request(app)
      .post("/referral/apply")
      .set("Authorization", `Bearer ${token2}`)
      .send({ code: referralCode });

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.status).toBe("PENDING");

    // 4. Reward referral (atomic transaction)
    const rewardRes = await request(app)
      .post("/referral/reward")
      .set("Authorization", `Bearer ${token1}`)
      .send({ referrerId, referredUserId: referredId });

    expect(rewardRes.status).toBe(200);
    expect(rewardRes.body.referral.rewarded).toBe(true);

    // 5. Referrer redeems 50 points
    const redeemRes = await request(app)
      .post("/referral/redeem")
      .set("Authorization", `Bearer ${token1}`)
      .send({ points: 50, reason: "Redeem test reward" });

    expect(redeemRes.status).toBe(200);
    expect(redeemRes.body.type).toBe("REDEEM");

    // 6. Retrieve referral history and ledger
    const historyRes = await request(app)
      .get("/referral/history")
      .set("Authorization", `Bearer ${token1}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.summary.referralPoints).toBe(50);
  });
});
