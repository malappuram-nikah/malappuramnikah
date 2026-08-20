import { ToggleBlockUseCase } from "../application/use-cases/ToggleBlock.usecase";
import { SubmitFeedbackUseCase } from "../application/use-cases/SubmitFeedback.usecase";
import { DownloadBiodataUseCase } from "../application/use-cases/DownloadBiodata.usecase";
import { IBusinessRepository } from "../domain/repositories/IBusinessRepository";

describe("Business Module - Use Cases", () => {
  let mockBizRepo: jest.Mocked<IBusinessRepository>;

  beforeEach(() => {
    mockBizRepo = {
      toggleBlock: jest.fn(),
      getBlockedIds: jest.fn(),
      toggleFavourite: jest.fn(),
      getFavouriteAndBlockedIds: jest.fn(),
      createFeedback: jest.fn(),
      checkBiodataAccessPermission: jest.fn(),
      isBiodataDownloadEnabled: jest.fn(),
      recordBiodataDownload: jest.fn(),
      getUserById: jest.fn(),
    };
  });

  describe("ToggleBlockUseCase", () => {
    it("should throw error if user tries to block themselves", async () => {
      const useCase = new ToggleBlockUseCase(mockBizRepo);
      await expect(useCase.execute(1, 1)).rejects.toThrow("Invalid target_id");
    });

    it("should toggle block status for valid target user", async () => {
      const useCase = new ToggleBlockUseCase(mockBizRepo);
      mockBizRepo.toggleBlock.mockResolvedValue("BLOCKED");

      const res = await useCase.execute(1, 2);
      expect(res).toBe("BLOCKED");
      expect(mockBizRepo.toggleBlock).toHaveBeenCalledWith(1, 2);
    });
  });

  describe("SubmitFeedbackUseCase", () => {
    it("should throw error if category is invalid", async () => {
      const useCase = new SubmitFeedbackUseCase(mockBizRepo);
      await expect(
        useCase.execute(1, "INVALID", 5, "Great app", "I love this app so much!")
      ).rejects.toThrow("Invalid category.");
    });

    it("should throw error if rating is out of bounds", async () => {
      const useCase = new SubmitFeedbackUseCase(mockBizRepo);
      await expect(
        useCase.execute(1, "SUGGESTION", 10, "Great app", "I love this app so much!")
      ).rejects.toThrow("Invalid rating.");
    });

    it("should create feedback when input is valid", async () => {
      const useCase = new SubmitFeedbackUseCase(mockBizRepo);
      mockBizRepo.createFeedback.mockResolvedValue({ id: 1 });

      const res = await useCase.execute(1, "BUG", 4, "App issue", "Found a minor UI bug in dashboard.");
      expect(res.id).toBe(1);
    });
  });

  describe("DownloadBiodataUseCase", () => {
    it("should throw error if biodata downloads are disabled by admin", async () => {
      const useCase = new DownloadBiodataUseCase(mockBizRepo);
      mockBizRepo.getUserById.mockResolvedValue({ id: 2, first_name: "Fatima" });
      mockBizRepo.isBiodataDownloadEnabled.mockReturnValue(false);

      await expect(useCase.execute(1, "2")).rejects.toThrow(
        "Biodata downloads are currently disabled by the administrator."
      );
    });

    it("should throw error if biodata permission is denied (unmatched)", async () => {
      const useCase = new DownloadBiodataUseCase(mockBizRepo);
      mockBizRepo.getUserById.mockResolvedValue({ id: 2, first_name: "Fatima" });
      mockBizRepo.isBiodataDownloadEnabled.mockReturnValue(true);
      mockBizRepo.checkBiodataAccessPermission.mockResolvedValue({
        allowed: false,
        status: "PENDING",
        isSelf: false,
      });

      await expect(useCase.execute(1, "2")).rejects.toThrow(
        "Access denied. Biodata is available after the profile owner accepts your invite."
      );
    });

    it("should allow biodata download for accepted mutual match", async () => {
      const useCase = new DownloadBiodataUseCase(mockBizRepo);
      mockBizRepo.getUserById.mockResolvedValue({ id: 2, first_name: "Fatima", last_name: "M" });
      mockBizRepo.isBiodataDownloadEnabled.mockReturnValue(true);
      mockBizRepo.checkBiodataAccessPermission.mockResolvedValue({
        allowed: true,
        status: "ACCEPTED",
        isSelf: false,
      });
      mockBizRepo.recordBiodataDownload.mockResolvedValue();

      const res = await useCase.execute(1, "2");
      expect(res.success).toBe(true);
      expect(res.isAccepted).toBe(true);
    });
  });
});
