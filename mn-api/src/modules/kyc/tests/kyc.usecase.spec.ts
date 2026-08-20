import { SubmitKycUseCase } from "../application/use-cases/SubmitKyc.usecase";
import { GetKycDocumentUseCase } from "../application/use-cases/GetKycDocument.usecase";
import { IKycRepository } from "../domain/repositories/IKycRepository";
import { IStorageRepository } from "../../../shared/storage/IStorageRepository";

class MockStorageRepo implements IStorageRepository {
  async uploadFile(): Promise<any> {
    return { url: "https://example.com/kyc.png", fileName: "kyc.png" };
  }
  async deleteFile(): Promise<void> {}
  getPrivateUrl(): string { return "https://example.com/signed"; }
}

describe("KYC Module - Use Cases Suite", () => {
  let mockKycRepo: jest.Mocked<IKycRepository>;
  let mockStorageRepo: MockStorageRepo;

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
    mockStorageRepo = new MockStorageRepo();
  });

  describe("SubmitKycUseCase", () => {
    it("should throw error if documentType is invalid", async () => {
      const useCase = new SubmitKycUseCase(mockKycRepo, mockStorageRepo);
      await expect(
        useCase.execute({
          userId: 1,
          documentType: "INVALID",
          frontBase64: "data:image/jpeg;base64,12345",
        })
      ).rejects.toThrow("Invalid document type.");
    });
  });

  describe("GetKycDocumentUseCase", () => {
    it("should throw UnauthorizedError if unauthenticated user tries to view document", async () => {
      const useCase = new GetKycDocumentUseCase(mockKycRepo);
      await expect(useCase.execute("doc.jpg", null, false)).rejects.toThrow(
        "Unauthorized. Missing or invalid token."
      );
    });
  });
});
