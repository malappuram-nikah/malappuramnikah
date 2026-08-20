import { IKycRepository } from "../../domain/repositories/IKycRepository";
import { KycApplicationEntity, KycDocumentEntity } from "../../domain/entities/kyc.entity";
import { prisma, runInTransaction } from "../../../../infrastructure/database/prisma.service";

export class PrismaKycRepository implements IKycRepository {
  async getApplicationByUserId(userId: number): Promise<KycApplicationEntity | null> {
    const app = await prisma.kycApplication.findUnique({
      where: { user_id: userId },
      include: { documents: true },
    });
    return app as unknown as KycApplicationEntity | null;
  }

  async getApplicationById(id: number): Promise<KycApplicationEntity | null> {
    const app = await prisma.kycApplication.findUnique({
      where: { id },
      include: { documents: true },
    });
    return app as unknown as KycApplicationEntity | null;
  }

  async getDocumentById(documentId: number): Promise<KycDocumentEntity | null> {
    const doc = await prisma.kycDocument.findUnique({
      where: { id: documentId },
    });
    return doc as unknown as KycDocumentEntity | null;
  }

  async createOrUpdateApplication(userId: number, status: string): Promise<KycApplicationEntity> {
    const app = await prisma.kycApplication.upsert({
      where: { user_id: userId },
      update: {
        status: status as any,
        submitted_at: new Date(),
      },
      create: {
        user_id: userId,
        status: status as any,
        submitted_at: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kyc_status: status },
    });

    return app as unknown as KycApplicationEntity;
  }

  async addOrReplaceDocument(
    kycApplicationId: number,
    documentType: string,
    frontUrl: string,
    backUrl?: string | null
  ): Promise<KycDocumentEntity> {
    await prisma.kycDocument.deleteMany({
      where: { kyc_application_id: kycApplicationId },
    });

    const doc = await prisma.kycDocument.create({
      data: {
        kyc_application_id: kycApplicationId,
        document_type: documentType,
        front_url: frontUrl,
        back_url: backUrl,
      },
    });

    return doc as unknown as KycDocumentEntity;
  }

  async updateApplicationStatus(
    id: number,
    status: string,
    rejectedReason?: string | null
  ): Promise<KycApplicationEntity> {
    const updateData: any = {
      status: status as any,
      rejected_reason: rejectedReason || null,
    };

    if (status === "VERIFIED") {
      updateData.verified_at = new Date();
    }

    const app = await prisma.kycApplication.update({
      where: { id },
      data: updateData,
    });

    await prisma.user.update({
      where: { id: app.user_id },
      data: {
        kyc_status: status,
        kyc_rejected_reason: rejectedReason || null,
        kyc_verified_at: status === "VERIFIED" ? new Date() : undefined,
      },
    });

    return app as unknown as KycApplicationEntity;
  }

  async createAuditLog(
    kycApplicationId: number,
    adminId: number,
    action: string,
    previousStatus: string,
    newStatus: string,
    reason?: string | null
  ): Promise<void> {
    try {
      await (prisma as any).kycAuditLog?.create({
        data: {
          kyc_application_id: kycApplicationId,
          admin_id: adminId,
          action,
          previous_status: previousStatus,
          new_status: newStatus,
          reason,
        },
      });
    } catch {
      // Graceful fallback if audit log table is optional
    }
  }

  async updateUserKyc(
    userId: number,
    documentType: string,
    frontFileName: string,
    backFileName: string | null
  ): Promise<any> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        kyc_document_type: documentType,
        kyc_front_url: frontFileName,
        kyc_back_url: backFileName,
        kyc_status: "SUBMITTED",
        kyc_submitted_at: new Date(),
      },
    });
  }

  async getUserKycInfo(userId: number): Promise<any> {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kyc_status: true,
        kyc_front_url: true,
        kyc_back_url: true,
        profile_details: true,
        mobile_number: true,
      },
    });
  }

  async createNotification(userId: number, title: string, message: string, type: string): Promise<void> {
    await prisma.notification.create({
      data: {
        user_id: userId,
        sender_id: 1,
        title,
        message,
        type,
      },
    });
  }
}
