/** Re-exports profile completion from the canonical service. */
export {
  calculateProfileCompletion,
  averageProfileCompletion,
  type ProfileCompletionResult,
  type ProfileSectionCompletion,
} from "../../application/services/ProfileCompletionService";

export const ADMIN_USER_SELECT = {
  id: true,
  uuid: true,
  profile_for: true,
  gender: true,
  first_name: true,
  last_name: true,
  cast: true,
  location: true,
  email: true,
  mobile_number: true,
  dob: true,
  status: true,
  is_premium: true,
  is_new_user: true,
  last_login: true,
  profile_details: true,
  search_preferences: true,
  kyc_status: true,
  kyc_document_type: true,
  kyc_front_url: true,
  kyc_back_url: true,
  kyc_rejected_reason: true,
  kyc_submitted_at: true,
  kyc_verified_at: true,
  call_status: true,
  called_date: true,
  call_response: true,
  created_at: true,
  updated_at: true,
  referral_code: true,
  referral_points: true,
} as const;

import path from "path";
import fs from "fs";
import { MediaStorageService } from "../service/MediaStorageService";

export const KYC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "kyc");

export async function deleteKycFile(fileName: string | null): Promise<void> {
  if (!fileName) return;
  try {
    const filePath = path.join(KYC_UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[DPDP Cleanup] Deleted local KYC document file: ${fileName}`);
    }

    if (MediaStorageService.isCloudinaryConfigured) {
      const { v2: cloudinary } = require("cloudinary");
      let baseName = path.parse(fileName).name;

      if (fileName.includes("cloudinary.com")) {
        const parts = fileName.split(/\/upload\/(?:v\d+\/)?/)[1] || fileName.split(/\/authenticated\/(?:v\d+\/)?/)[1];
        if (parts) {
          baseName = parts.substring(0, parts.lastIndexOf(".")) || parts;
        }
      }

      const candidateIds = [
        `malappuram_nikah/kyc/${baseName}`,
        baseName,
      ];

      for (const id of candidateIds) {
        try {
          await cloudinary.uploader.destroy(id, { type: "authenticated", invalidate: true });
          await cloudinary.uploader.destroy(id, { type: "upload", invalidate: true });
        } catch {
          // ignore single candidate failure
        }
      }
      console.log(`[DPDP Cleanup] Purged Cloudinary KYC document: ${baseName}`);
    }
  } catch (err) {
    console.error(`[DPDP Cleanup] Failed to delete KYC file ${fileName}:`, err);
  }
}

export function buildKycDocumentUrl(fileName: string | null, token?: string): string | null {
  if (!fileName) return null;
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) return fileName;
  const base = process.env.APP_URL || process.env.BACKEND_URL || "https://malappuramnikah.onrender.com";
  const qs = token ? `?token=${token}` : "";
  return `${base}/user/kyc/document/${fileName}${qs}`;
}

