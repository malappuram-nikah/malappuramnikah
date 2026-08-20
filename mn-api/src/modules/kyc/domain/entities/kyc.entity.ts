export interface KycSubmission {
  userId: number;
  documentType: string;
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
