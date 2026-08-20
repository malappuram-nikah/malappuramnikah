import { KycDocumentInfo } from "../entities/kyc.entity";

export interface IKycRepository {
  updateUserKyc(
    userId: number,
    documentType: string,
    frontFileName: string,
    backFileName: string | null
  ): Promise<any>;
  getUserKycInfo(userId: number): Promise<{
    kyc_status: string;
    kyc_front_url: string | null;
    kyc_back_url: string | null;
    profile_details: any;
    mobile_number: string;
  } | null>;
  createNotification(userId: number, title: string, message: string, type: string): Promise<void>;
}
