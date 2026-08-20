import { ApproveKycUseCase } from "../../application/use-cases/ApproveKyc.usecase";
import { ReviewKycUseCase } from "../../application/use-cases/ReviewKyc.usecase";
import { SubmitKycUseCase } from "../../application/use-cases/SubmitKyc.usecase";
import { IKycRepository } from "../../domain/repositories/IKycRepository";

class MockKycRegressionRepo implements IKycRepository {
  public mockApp: any = { id: 77, user_id: 10, status: "VERIFIED" };

  async getApplicationByUserId(): Promise<any> { return this.mockApp; }
  async getApplicationById(): Promise<any> { return this.mockApp; }
  async getDocumentById(): Promise<any> { return null; }
  async createOrUpdateApplication(): Promise<any> { return this.mockApp; }
  async addOrReplaceDocument(): Promise<any> { return {}; }
  async updateApplicationStatus(id: number, status: string): Promise<any> {
    this.mockApp.status = status;
    return this.mockApp;
  }
  async createAuditLog(): Promise<void> {}
  async updateUserKyc(): Promise<any> { return {}; }
  async getUserKycInfo(): Promise<any> { return {}; }
  async createNotification(): Promise<void> {}
}

describe("KYC Module - Regression Tests (State Transition Protection)", () => {
  let repo: MockKycRegressionRepo;

  beforeEach(() => {
    repo = new MockKycRegressionRepo();
  });

  it("should prevent starting review on an ALREADY VERIFIED KYC application", async () => {
    const reviewUseCase = new ReviewKycUseCase(repo);
    await expect(reviewUseCase.execute(999, 77)).rejects.toThrow(
      "Cannot mark already verified KYC as under review."
    );
  });

  it("should prevent duplicate submission on an ALREADY VERIFIED KYC application", async () => {
    const mockStorage: any = { uploadFile: jest.fn() };
    const submitUseCase = new SubmitKycUseCase(repo, mockStorage);
    await expect(
      submitUseCase.execute({
        userId: 10,
        documentType: "PASSPORT",
        frontBase64: "data:image/png;base64,123",
      })
    ).rejects.toThrow("Cannot submit KYC. Current status is VERIFIED");
  });
});
