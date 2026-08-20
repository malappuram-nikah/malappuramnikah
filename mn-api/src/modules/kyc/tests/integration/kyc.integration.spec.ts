import { PrismaKycRepository } from "../../infrastructure/repositories/PrismaKycRepository";
import { SubmitKycUseCase } from "../../application/use-cases/SubmitKyc.usecase";
import { ReviewKycUseCase } from "../../application/use-cases/ReviewKyc.usecase";
import { ApproveKycUseCase } from "../../application/use-cases/ApproveKyc.usecase";
import { RejectKycUseCase } from "../../application/use-cases/RejectKyc.usecase";
import { ResubmitKycUseCase } from "../../application/use-cases/ResubmitKyc.usecase";
import { GetKycStatusUseCase } from "../../application/use-cases/GetKycStatus.usecase";
import { IStorageRepository, StorageUploadResult } from "../../../../shared/storage/IStorageRepository";
import { prisma } from "../../../../infrastructure/database/prisma.service";

class MockKycStorageRepository implements IStorageRepository {
  async uploadFile(): Promise<StorageUploadResult> {
    return {
      url: `https://storage.test/kyc/${Date.now()}.png`,
      fileName: `kyc_${Date.now()}.png`,
      publicId: `kyc_id_${Date.now()}`,
      isCloudinary: false,
    };
  }
  async deleteFile(): Promise<void> {}
  getPrivateUrl(fileName: string): string {
    return `https://storage.test/private/${fileName}`;
  }
}

describe("KYC Module - Integration Tests", () => {
  const repository = new PrismaKycRepository();
  const storageRepo = new MockKycStorageRepository();

  const submitKycUseCase = new SubmitKycUseCase(repository, storageRepo);
  const reviewKycUseCase = new ReviewKycUseCase(repository);
  const approveKycUseCase = new ApproveKycUseCase(repository);
  const rejectKycUseCase = new RejectKycUseCase(repository);
  const resubmitKycUseCase = new ResubmitKycUseCase(repository, storageRepo);
  const getKycStatusUseCase = new GetKycStatusUseCase(repository);

  let testUserId: number;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        profile_for: "Self",
        gender: "Male",
        first_name: "KycTestUser",
        last_name: "U",
        cast: "Sunni",
        location: "Malappuram",
        mobile_number: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "hashedpassword123",
        dob: "1995-05-05",
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      try {
        const app = await prisma.kycApplication.findUnique({ where: { user_id: testUserId } });
        if (app) {
          await prisma.kycDocument.deleteMany({ where: { kyc_application_id: app.id } });
          await prisma.kycApplication.delete({ where: { id: app.id } });
        }
        await prisma.user.delete({ where: { id: testUserId } });
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }
  });

  it("should complete submit -> review -> reject -> resubmit -> approve lifecycle end-to-end", async () => {
    const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // 1. Submit KYC
    const subRes = await submitKycUseCase.execute({
      userId: testUserId,
      documentType: "AADHAAR",
      frontBase64: dummyBase64,
    });
    expect(subRes.applicationId).toBeDefined();
    const appId = subRes.applicationId;

    let status = await getKycStatusUseCase.execute(testUserId);
    expect(status.status).toBe("SUBMITTED");

    // 2. Admin starts review
    await reviewKycUseCase.execute(999, appId);
    status = await getKycStatusUseCase.execute(testUserId);
    expect(status.status).toBe("UNDER_REVIEW");

    // 3. Admin rejects
    await rejectKycUseCase.execute(999, appId, "Front document blurry");
    status = await getKycStatusUseCase.execute(testUserId);
    expect(status.status).toBe("REJECTED");
    expect(status.rejected_reason).toBe("Front document blurry");

    // 4. User resubmits
    await resubmitKycUseCase.execute({
      userId: testUserId,
      documentType: "AADHAAR",
      frontBase64: dummyBase64,
    });
    status = await getKycStatusUseCase.execute(testUserId);
    expect(status.status).toBe("RESUBMITTED");

    // 5. Admin approves
    await approveKycUseCase.execute(999, appId);
    status = await getKycStatusUseCase.execute(testUserId);
    expect(status.status).toBe("VERIFIED");
  });
});
