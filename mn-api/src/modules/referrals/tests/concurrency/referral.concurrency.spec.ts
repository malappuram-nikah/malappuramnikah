import { RewardReferralUseCase } from "../../application/use-cases/RewardReferral.usecase";
import { RedeemPointsUseCase } from "../../application/use-cases/RedeemPoints.usecase";
import { PrismaReferralRepository } from "../../infrastructure/repositories/PrismaReferralRepository";
import prisma from "../../../../shared/database/prisma";

describe("Referrals Module - Concurrency & Race Condition Tests", () => {
  const repo = new PrismaReferralRepository();
  const rewardUseCase = new RewardReferralUseCase(repo);
  const redeemUseCase = new RedeemPointsUseCase(repo);

  let cReferrerId: number;
  let cReferredId: number;
  let cReferralId: number;

  beforeAll(async () => {
    const u1 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Female",
        first_name: "ConcReferrer",
        last_name: "One",
        dob: "1995-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876501111",
        password: "hashedpassword123",
        status: "ACTIVE",
        referral_points: 0,
      },
    });
    cReferrerId = u1.id;

    const u2 = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "ConcReferred",
        last_name: "Two",
        dob: "1993-01-01",
        cast: "Muslim",
        location: "Malappuram",
        mobile_number: "9876502222",
        password: "hashedpassword123",
        status: "ACTIVE",
        referral_points: 0,
      },
    });
    cReferredId = u2.id;

    const ref = await prisma.referral.create({
      data: {
        referrer_id: cReferrerId,
        referred_user_id: cReferredId,
        referral_code: `CONC${cReferrerId}`,
        status: "PENDING",
        rewarded: false,
      },
    });
    cReferralId = ref.id;
  });

  afterAll(async () => {
    await prisma.referralTransaction.deleteMany({ where: { user_id: cReferrerId } });
    await prisma.referral.deleteMany({ where: { id: cReferralId } });
    await prisma.user.deleteMany({ where: { id: { in: [cReferrerId, cReferredId] } } });
  });

  it("should prevent duplicate rewarding during concurrent parallel execution", async () => {
    // Fire 5 concurrent reward requests simultaneously
    const results = await Promise.allSettled([
      rewardUseCase.execute(cReferrerId, cReferredId),
      rewardUseCase.execute(cReferrerId, cReferredId),
      rewardUseCase.execute(cReferrerId, cReferredId),
      rewardUseCase.execute(cReferrerId, cReferredId),
      rewardUseCase.execute(cReferrerId, cReferredId),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly 1 request must succeed, 4 must be rejected
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(4);

    // Verify referrer has exactly 100 points
    const user = await prisma.user.findUnique({ where: { id: cReferrerId } });
    expect(user?.referral_points).toBe(100);
  });

  it("should prevent over-redemption when concurrent points redemptions exceed balance", async () => {
    // User has 100 points. Try redeeming 70 points twice simultaneously (total 140 points)
    const results = await Promise.allSettled([
      redeemUseCase.execute(cReferrerId, 70, "Concurrent Redeem 1"),
      redeemUseCase.execute(cReferrerId, 70, "Concurrent Redeem 2"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Only 1 redemption of 70 points can succeed; 1 must fail due to balance check
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const user = await prisma.user.findUnique({ where: { id: cReferrerId } });
    expect(user?.referral_points).toBe(30);
  });
});
