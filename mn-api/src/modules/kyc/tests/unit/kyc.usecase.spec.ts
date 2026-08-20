import { SubmitKycUseCase } from "../../application/use-cases/SubmitKyc.usecase";
import { ReplaceDocumentUseCase } from "../../application/use-cases/ReplaceDocument.usecase";
import { ApproveKycUseCase } from "../../application/use-cases/ApproveKyc.usecase";
import { RejectKycUseCase } from "../../application/use-cases/RejectKyc.usecase";
import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { IStorageRepository } from "../../../../shared/storage/IStorageRepository";

class MockStorageRepo implements IStorageRepository {
  async uploadFile(): Promise<any> {
    return { url: "https://example.com/kyc.png", fileName: "kyc.png" };
  }
  async deleteFile(): Promise<void> {}
  getPrivateUrl(): string { return "https://example.com/signed"; }
}

describe("KYC Module - Unit Tests", () => {
  let mockKycRepo: jest.Mocked<IKycRepository>;
  let storageRepo: MockStorageRepo;

  beforeEach(() => {
    mockKycRepo = {
      getApplicationByUserId: jest.fn(),
      getApplicationById: jest.fn(),
      getDocumentById: jest.fn(),
      createOrUpdateApplication: jest.fn(),
      addOrReplaceDocument: jest.fn(),
      updateApplicationStatus: jest.fn(),
      createAuditLog: jest.fn(),
      updateUserKyc: jest.fn(),
      getUserKycInfo: jest.fn(),
      createNotification: jest.fn(),
    };
    storageRepo = new MockStorageRepo();
  });

  describe("SubmitKycUseCase", () => {
    it("should throw error if documentType is invalid", async () => {
      const useCase = new SubmitKycUseCase(mockKycRepo, storageRepo);
      await expect(
        useCase.execute({
          userId: 1,
          documentType: "INVALID_DOC",
          frontBase64: "data:image/png;base64,123",
        })
      ).rejects.toThrow("Invalid document type");
    });

    it("should submit valid Aadhaar KYC document cleanly", async () => {
      mockKycRepo.getApplicationByUserId.mockResolvedValue(null);
      mockKycRepo.createOrUpdateApplication.mockResolvedValue({ id: 10, user_id: 1, status: "SUBMITTED" } as any);
      mockKycRepo.addOrReplaceDocument.mockResolvedValue({ id: 100 } as any);

      const useCase = new SubmitKycUseCase(mockKycRepo, storageRepo);
      const res = await useCase.execute({
        userId: 1,
        documentType: "AADHAAR",
        frontBase64: "data:image/png;base64,123",
      });

      expect(res.applicationId).toBe(10);
      expect(res.message).toContain("submitted successfully");
    });
  });

  describe("ReplaceDocumentUseCase", () => {
    it("should replace document for an existing non-verified KYC application", async () => {
      mockKycRepo.getApplicationByUserId.mockResolvedValue({ id: 10, userId: 1, user_id: 1, status: "REJECTED" } as any);
      mockKycRepo.addOrReplaceDocument.mockResolvedValue({ id: 100 } as any);

      const useCase = new ReplaceDocumentUseCase(mockKycRepo, storageRepo);
      const res = await useCase.execute({
        userId: 1,
        documentType: "PASSPORT",
        frontBase64: "data:image/png;base64,456",
      });

      expect(res.applicationId).toBe(10);
      expect(res.message).toBe("KYC document replaced successfully.");
    });

    it("should throw error when trying to replace document on a VERIFIED application", async () => {
      mockKycRepo.getApplicationByUserId.mockResolvedValue({ id: 10, userId: 1, user_id: 1, status: "VERIFIED" } as any);

      const useCase = new ReplaceDocumentUseCase(mockKycRepo, storageRepo);
      await expect(
        useCase.execute({
          userId: 1,
          documentType: "PASSPORT",
          frontBase64: "data:image/png;base64,456",
        })
      ).rejects.toThrow("Cannot replace documents for an already VERIFIED KYC application.");
    });
  });

  describe("ApproveKycUseCase & RejectKycUseCase", () => {
    it("should approve KYC application and create audit record", async () => {
      mockKycRepo.getApplicationById.mockResolvedValue({ id: 10, user_id: 1, status: "SUBMITTED" } as any);

      const approveUseCase = new ApproveKycUseCase(mockKycRepo);
      const res = await approveUseCase.execute(999, 10);

      expect(res.message).toBe("KYC Application approved successfully.");
      expect(mockKycRepo.createAuditLog).toHaveBeenCalledWith(
        10,
        999,
        "APPROVE_KYC",
        "SUBMITTED",
        "VERIFIED",
        expect.any(String)
      );
    });

    it("should reject KYC application with rejection reason", async () => {
      mockKycRepo.getApplicationById.mockResolvedValue({ id: 10, user_id: 1, status: "SUBMITTED" } as any);

      const rejectUseCase = new RejectKycUseCase(mockKycRepo);
      const res = await rejectUseCase.execute(999, 10, "Document image too blurry");

      expect(res.message).toBe("KYC Application rejected.");
      expect(mockKycRepo.createAuditLog).toHaveBeenCalledWith(
        10,
        999,
        "REJECT_KYC",
        "SUBMITTED",
        "REJECTED",
        "Document image too blurry"
      );
    });
  });
});
