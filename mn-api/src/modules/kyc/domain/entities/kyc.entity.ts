export type KycStatusType =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "RESUBMITTED";

export interface KycDocumentEntity {
  id: number;
  kyc_application_id: number;
  document_type: string;
  front_url?: string | null;
  back_url?: string | null;
  is_verified: boolean;
  created_at: Date;
}

export interface KycApplicationEntity {
  id: number;
  user_id: number;
  status: KycStatusType;
  submitted_at?: Date | null;
  verified_at?: Date | null;
  rejected_reason?: string | null;
  created_at: Date;
  updated_at: Date;
  documents?: KycDocumentEntity[];
}

export interface KycAuditLogEntity {
  id: number;
  kyc_application_id: number;
  admin_id: number;
  action: string;
  previous_status: string;
  new_status: string;
  reason?: string | null;
  created_at: Date;
}

export interface KycSubmissionDto {
  userId: number;
  documentType: string; // AADHAAR, PASSPORT, VOTER_ID, DRIVING_LICENSE, PAN
  frontBase64: string;
  backBase64?: string;
}

export interface KycDocumentInfo {
  fileName: string;
  filePath?: string;
  contentType: string;
  isCloudinary?: boolean;
  signedUrl?: string;
}
