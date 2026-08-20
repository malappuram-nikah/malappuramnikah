import { KycApplicationEntity, KycDocumentEntity } from "../entities/kyc.entity";

export interface IKycRepository {
  getApplicationByUserId(userId: number): Promise<KycApplicationEntity | null>;
  getApplicationById(id: number): Promise<KycApplicationEntity | null>;
  getDocumentById(documentId: number): Promise<KycDocumentEntity | null>;
  createOrUpdateApplication(userId: number, status: string): Promise<KycApplicationEntity>;
  addOrReplaceDocument(
    kycApplicationId: number,
    documentType: string,
    frontUrl: string,
    backUrl?: string | null
  ): Promise<KycDocumentEntity>;
  updateApplicationStatus(
    id: number,
    status: string,
    rejectedReason?: string | null
  ): Promise<KycApplicationEntity>;
  createAuditLog(
    kycApplicationId: number,
    adminId: number,
    action: string,
    previousStatus: string,
    newStatus: string,
    reason?: string | null
  ): Promise<void>;
  updateUserKyc(
    userId: number,
    documentType: string,
    frontFileName: string,
    backFileName: string | null
  ): Promise<any>;
  getUserKycInfo(userId: number): Promise<any>;
  createNotification(userId: number, title: string, message: string, type: string): Promise<void>;
}
