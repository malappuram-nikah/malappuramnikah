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
  created_at: true,
  updated_at: true,
  referral_code: true,
  referral_points: true,
} as const;

export function buildKycDocumentUrl(fileName: string | null, token?: string): string | null {
  if (!fileName) return null;
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) return fileName;
  const base = process.env.APP_URL || process.env.BACKEND_URL || "https://malappuramnikah.onrender.com";
  const qs = token ? `?token=${token}` : "";
  return `${base}/user/kyc/document/${fileName}${qs}`;
}
