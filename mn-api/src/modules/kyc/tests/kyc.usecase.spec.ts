import { SubmitKycUseCase } from "../application/use-cases/SubmitKyc.usecase";
import { GetKycDocumentUseCase } from "../application/use-cases/GetKycDocument.usecase";
import { IKycRepository } from "../domain/repositories/IKycRepository";

describe("KYC Module - Use Cases", () => {
  let mockKycRepo: jest.Mocked<IKycRepository>;

  beforeEach(() => {
    mockKycRepo = {
      updateUserKyc: jest.fn(),
      getUserKycInfo: jest.fn(),
      createNotification: jest.fn(),
    };
  });

  describe("SubmitKycUseCase", () => {
    it("should throw error if document_type is invalid", async () => {
      const useCase = new SubmitKycUseCase(mockKycRepo);
      await expect(
        useCase.execute(1, "Fake ID", "data:image/jpeg;base64,12345")
      ).rejects.toThrow("Invalid document type.");
    });

    it("should throw error if user has pending KYC submission", async () => {
      const useCase = new SubmitKycUseCase(mockKycRepo);
      mockKycRepo.getUserKycInfo.mockResolvedValue({
        kyc_status: "PENDING",
        kyc_front_url: null,
        kyc_back_url: null,
        profile_details: {},
        mobile_number: "+919876543210",
      });

      await expect(
        useCase.execute(1, "Aadhaar Card", "data:image/jpeg;base64,12345")
      ).rejects.toThrow("A verification request is already pending or under review.");
    });
  });

  describe("GetKycDocumentUseCase", () => {
    it("should throw UnauthorizedError if unauthenticated user tries to view document", async () => {
      const useCase = new GetKycDocumentUseCase(mockKycRepo);
      await expect(useCase.execute("doc.jpg", null, false)).rejects.toThrow(
        "Unauthorized. Missing or invalid token."
      );
    });

    it("should throw ForbiddenError if non-owner and non-admin user tries to view document", async () => {
      const useCase = new GetKycDocumentUseCase(mockKycRepo);
      mockKycRepo.getUserKycInfo.mockResolvedValue({
        kyc_status: "VERIFIED",
        kyc_front_url: "my_doc_front.jpg",
        kyc_back_url: "my_doc_back.jpg",
        profile_details: {},
        mobile_number: "+919999999999",
      });

      await expect(useCase.execute("other_user_doc.jpg", 1, false)).rejects.toThrow(
        "Forbidden. You do not have permission to view this document."
      );
    });
  });
});
