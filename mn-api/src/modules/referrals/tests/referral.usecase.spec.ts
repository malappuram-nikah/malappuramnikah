import { ValidateReferralCodeUseCase } from "../application/use-cases/ValidateReferralCode.usecase";
import { RedeemReferralPointsUseCase } from "../application/use-cases/RedeemReferralPoints.usecase";
import { IReferralRepository } from "../domain/repositories/IReferralRepository";

describe("Referrals Module - Use Cases", () => {
  let mockRefRepo: jest.Mocked<IReferralRepository>;

  beforeEach(() => {
    mockRefRepo = {
      findUserByReferralCode: jest.fn(),
      getUserReferralInfo: jest.fn(),
      getReferralHistory: jest.fn(),
      getReferralTransactions: jest.fn(),
      redeemPoints: jest.fn(),
      generateUniqueCode: jest.fn(),
    };
  });

  describe("ValidateReferralCodeUseCase", () => {
    it("should throw BadRequestError if user tries to validate their own referral code", async () => {
      const useCase = new ValidateReferralCodeUseCase(mockRefRepo);
      mockRefRepo.findUserByReferralCode.mockResolvedValue({ id: 1, first_name: "Ali" });

      await expect(useCase.execute("ALI123", 1)).rejects.toThrow("You cannot refer yourself");
    });

    it("should return referrer name for valid referral code", async () => {
      const useCase = new ValidateReferralCodeUseCase(mockRefRepo);
      mockRefRepo.findUserByReferralCode.mockResolvedValue({ id: 2, first_name: "Fatima" });

      const res = await useCase.execute("FATIMA123", 1);
      expect(res.referrerName).toBe("Fatima");
    });
  });

  describe("RedeemReferralPointsUseCase", () => {
    it("should throw BadRequestError if user has insufficient referral points", async () => {
      const useCase = new RedeemReferralPointsUseCase(mockRefRepo);
      mockRefRepo.getUserReferralInfo.mockResolvedValue({
        referralCode: "ALI123",
        points: 50,
        stats: { total: 1, successful: 1, pending: 0 },
      });

      await expect(useCase.execute(1, 100)).rejects.toThrow("Insufficient referral points");
    });

    it("should redeem points successfully when user has enough points", async () => {
      const useCase = new RedeemReferralPointsUseCase(mockRefRepo);
      mockRefRepo.getUserReferralInfo.mockResolvedValue({
        referralCode: "ALI123",
        points: 200,
        stats: { total: 2, successful: 2, pending: 0 },
      });
      mockRefRepo.redeemPoints.mockResolvedValue();

      await useCase.execute(1, 100);
      expect(mockRefRepo.redeemPoints).toHaveBeenCalledWith(1, 100);
    });
  });
});
