/** Server-side admin helpers — mirrors frontend profile completion logic using DB data only. */

const DRAFT_KEYS = [
  "mn_basic_details_draft",
  "mn_religious_info_draft",
  "mn_professional_info_draft",
  "mn_family_details_draft",
  "mn_interests_draft",
  "mn_habits_draft",
  "mn_partner_preferences_draft",
  "mn_profile_photos_draft",
  "mn_voice_intro_draft",
] as const;

export function calculateProfileCompletion(user: {
  first_name?: string;
  last_name?: string;
  cast?: string;
  location?: string;
  gender?: string;
  kyc_status?: string;
  profile_details?: any;
}): { percentage: number; completedSteps: number; totalSteps: number } {
  const details = user.profile_details || {};
  let completed = 0;
  const totalSteps = 11; // 10 profile sections + KYC

  const basic = details.mn_basic_details_draft || {};
  if (basic.height || basic.maritalStatus || user.first_name) completed++;

  const religious = details.mn_religious_info_draft || {};
  if (religious.namaz && religious.religiousness) completed++;

  const prof = details.mn_professional_info_draft || {};
  if (prof.education || prof.profession || prof.highestEducation) completed++;

  const family = details.mn_family_details_draft || {};
  if (family.familyType || family.familyStatus || family.fatherOccupation) completed++;

  const interests = details.mn_interests_draft || {};
  if (Object.keys(interests).length > 0) completed++;

  const habits = details.mn_habits_draft || {};
  if (Object.keys(habits).length > 0) completed++;

  const partner = details.mn_partner_preferences_draft || {};
  if (Object.keys(partner).length > 0) completed++;

  const photos = details.mn_profile_photos_draft?.photos;
  if (photos && photos.length > 0) completed++;

  const voice = details.mn_voice_intro_draft?.voice;
  if (voice) completed++;

  const video = details.mn_video_intro_draft?.video;
  if (video) completed++;

  if (user.kyc_status === "VERIFIED") completed++;

  const percentage = Math.round((completed / totalSteps) * 100);
  return { percentage, completedSteps: completed, totalSteps };
}

export function averageProfileCompletion(
  users: Array<{ first_name?: string; last_name?: string; cast?: string; location?: string; gender?: string; kyc_status?: string; profile_details?: any }>
): number {
  if (users.length === 0) return 0;
  const sum = users.reduce((acc, u) => acc + calculateProfileCompletion(u).percentage, 0);
  return Math.round(sum / users.length);
}

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
