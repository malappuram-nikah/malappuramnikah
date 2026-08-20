import { ExpressInterestUseCase } from "../application/use-cases/ExpressInterest.usecase";
import { GetUserInterestsUseCase } from "../application/use-cases/GetUserInterests.usecase";
import { IInterestRepository } from "../domain/repositories/IInterestRepository";
import { InterestEntity } from "../domain/entities/interest.entity";

describe("Interests Module - Use Cases", () => {
  let mockInterestRepo: jest.Mocked<IInterestRepository>;

  beforeEach(() => {
    mockInterestRepo = {
      findInterest: jest.fn(),
      createInterest: jest.fn(),
      updateInterestStatus: jest.fn(),
      deleteInterest: jest.fn(),
      getUserForInterestCheck: jest.fn(),
      getUserInterests: jest.fn(),
    };
  });

  describe("ExpressInterestUseCase", () => {
    it("should return KYC_REQUIRED if user is not ID verified", async () => {
      const useCase = new ExpressInterestUseCase(mockInterestRepo);
      mockInterestRepo.getUserForInterestCheck.mockImplementation(async (id) => {
        if (id === 1) return { id: 1, kyc_status: "NOT_SUBMITTED", gender: "Male", first_name: "Ali", last_name: "K", location: "Malappuram", profile_details: {} };
        if (id === 2) return { id: 2, kyc_status: "VERIFIED", gender: "Female", first_name: "Fatima", last_name: "M", location: "Kozhikode", profile_details: {} };
        return null;
      });

      const res = await useCase.execute(1, 2);
      expect(res.status).toBe("KYC_REQUIRED");
      expect(res.requireKyc).toBe(true);
    });

    it("should withdraw interest if pending interest already exists", async () => {
      const useCase = new ExpressInterestUseCase(mockInterestRepo);
      mockInterestRepo.getUserForInterestCheck.mockImplementation(async (id) => {
        if (id === 1) return { id: 1, kyc_status: "VERIFIED", gender: "Male", first_name: "Ali", last_name: "K", location: "Malappuram", profile_details: {} };
        if (id === 2) return { id: 2, kyc_status: "VERIFIED", gender: "Female", first_name: "Fatima", last_name: "M", location: "Kozhikode", profile_details: {} };
        return null;
      });
      mockInterestRepo.findInterest.mockResolvedValue({
        id: 10,
        sender_id: 1,
        receiver_id: 2,
        status: "PENDING",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await useCase.execute(1, 2);
      expect(res.status).toBe("NONE");
      expect(mockInterestRepo.deleteInterest).toHaveBeenCalledWith(10);
    });

    it("should establish mutual match if receiver already sent interest to sender", async () => {
      const useCase = new ExpressInterestUseCase(mockInterestRepo);
      mockInterestRepo.getUserForInterestCheck.mockImplementation(async (id) => {
        if (id === 1) return { id: 1, kyc_status: "VERIFIED", gender: "Male", first_name: "Ali", last_name: "K", location: "Malappuram", profile_details: {} };
        if (id === 2) return { id: 2, kyc_status: "VERIFIED", gender: "Female", first_name: "Fatima", last_name: "M", location: "Kozhikode", profile_details: {} };
        return null;
      });
      mockInterestRepo.findInterest.mockImplementation(async (sender, receiver) => {
        if (sender === 1 && receiver === 2) return null;
        if (sender === 2 && receiver === 1) {
          return { id: 9, sender_id: 2, receiver_id: 1, status: "PENDING", created_at: new Date(), updated_at: new Date() };
        }
        return null;
      });
      mockInterestRepo.createInterest.mockResolvedValue({
        id: 11,
        sender_id: 1,
        receiver_id: 2,
        status: "PENDING",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await useCase.execute(1, 2);
      expect(res.status).toBe("ACCEPTED");
      expect(mockInterestRepo.updateInterestStatus).toHaveBeenCalledWith(11, "ACCEPTED");
      expect(mockInterestRepo.updateInterestStatus).toHaveBeenCalledWith(9, "ACCEPTED");
    });
  });
});
