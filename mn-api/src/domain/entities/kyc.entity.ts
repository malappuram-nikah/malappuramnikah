export type KycStatusType = "NOT_SUBMITTED" | "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";

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

export interface KycDocumentEntity {
  id: number;
  kyc_application_id: number;
  document_type: string;
  front_url?: string | null;
  back_url?: string | null;
  is_verified: boolean;
  created_at: Date;
}
