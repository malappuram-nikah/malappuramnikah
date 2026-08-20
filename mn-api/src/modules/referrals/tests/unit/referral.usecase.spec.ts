import { ApplyReferralCodeUseCase } from "../../application/use-cases/ApplyReferralCode.usecase";
import { RewardReferralUseCase } from "../../application/use-cases/RewardReferral.usecase";
import { RedeemPointsUseCase } from "../../application/use-cases/RedeemPoints.usecase";
import { IReferralRepository } from "../../domain/repositories/IReferralRepository";
import prisma from "../../../../shared/database/prisma";

describe("Referrals Module - Unit Tests", () => {
  let mockReferralRepo: jest.Mocked<IReferralRepository>;

  beforeEach(() => {
    mockReferralRepo = {
      findUserReferralCode: jest.fn(),
      setUserReferralCode: jest.fn(),
      findUserByReferralCode: jest.fn(),
      findReferral: jest.fn(),
      findReferralByReferredUser: jest.fn(),
      createReferral: jest.fn(),
      getSettings: jest.fn(),
      executeRewardTransaction: jest.fn(),
      executePointsTransaction: jest.fn(),
      getReferralHistory: jest.fn(),
      getTransactions: jest.fn(),
      getSummary: jest.fn(),
    };
  });

  describe("ApplyReferralCodeUseCase", () => {
    it("should throw error if user attempts self-referral", async () => {
      mockReferralRepo.getSettings.mockResolvedValue({
        id: 1,
        points_per_referral: 100,
        reward_condition: "SIGNUP",
        enabled: true,
        max_referral: 100,
        daily_limit: 10,
      });
      mockReferralRepo.findUserByReferralCode.mockResolvedValue({ id: 10, referral_code: "MN10ABC" });

      const useCase = new ApplyReferralCodeUseCase(mockReferralRepo);
      await expect(useCase.execute(10, "MN10ABC")).rejects.toThrow("Self-referrals are strictly prohibited.");
    });
  });

  describe("RewardReferralUseCase", () => {
    it("should throw error if referral has already been rewarded", async () => {
      mockReferralRepo.getSettings.mockResolvedValue({
        id: 1,
        points_per_referral: 100,
        reward_condition: "SIGNUP",
        enabled: true,
        max_referral: 100,
        daily_limit: 10,
      });
      mockReferralRepo.findReferral.mockResolvedValue({
        id: 1,
        referrer_id: 10,
        referred_user_id: 20,
        referral_code: "MN10ABC",
        status: "COMPLETED",
        rewarded: true,
        created_at: new Date(),
      });

      const useCase = new RewardReferralUseCase(mockReferralRepo);
      await expect(useCase.execute(10, 20)).rejects.toThrow("Referral has already been rewarded or completed.");
    });
  });

  describe("RedeemPointsUseCase", () => {
    it("should throw error if user balance is insufficient", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ referral_points: 30 } as any);
      const useCase = new RedeemPointsUseCase(mockReferralRepo);
      await expect(useCase.execute(10, 50)).rejects.toThrow("Insufficient referral points balance");
    });
  });
});
