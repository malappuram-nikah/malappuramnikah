import { ValidateReferralCodeUseCase } from "../application/use-cases/ValidateReferralCode.usecase";
import { RedeemReferralPointsUseCase } from "../application/use-cases/RedeemReferralPoints.usecase";
import { IReferralRepository } from "../domain/repositories/IReferralRepository";

describe("Referrals Module - Legacy Tests Suite", () => {
  let mockRefRepo: jest.Mocked<IReferralRepository>;

  beforeEach(() => {
    mockRefRepo = {
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

  describe("ValidateReferralCodeUseCase", () => {
    it("should return valid flag for existing referral code", async () => {
      const useCase = new ValidateReferralCodeUseCase(mockRefRepo);
      mockRefRepo.findUserByReferralCode.mockResolvedValue({ id: 2, referral_code: "FATIMA123" });

      const res = await useCase.execute("FATIMA123");
      expect(res.valid).toBe(true);
      expect(res.referrerId).toBe(2);
    });
  });

  describe("RedeemReferralPointsUseCase", () => {
    it("should redeem points successfully via executePointsTransaction", async () => {
      const useCase = new RedeemReferralPointsUseCase(mockRefRepo);
      mockRefRepo.executePointsTransaction.mockResolvedValue({
        id: 1,
        user_id: 1,
        referral_id: null,
        points: 100,
        type: "REDEEM",
        reason: "Points redemption",
        created_at: new Date(),
      });

      const res = await useCase.execute(1, 100);
      expect(res.points).toBe(100);
      expect(mockRefRepo.executePointsTransaction).toHaveBeenCalledWith(1, 100, "REDEEM", "Points redemption");
    });
  });
});
