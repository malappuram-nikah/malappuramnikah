/**
 * Single source of truth for profile strength / completion calculation.
 */

export type SectionStatus = "complete" | "partial" | "empty";

export interface ProfileSectionCompletion {
  id: string;
  name: string;
  draftKey: string;
  weight: number;
  step: number;
  status: SectionStatus;
  percentage: number;
  missingFields: string[];
  suggestion: string;
}

export interface ProfileCompletionResult {
  percentage: number;
  strength: "Weak" | "Average" | "Strong" | "Excellent";
  completedSections: number;
  totalSections: number;
  sections: ProfileSectionCompletion[];
  incompleteSections: ProfileSectionCompletion[];
}

export type ProfileUser = {
  first_name?: string;
  last_name?: string;
  cast?: string;
  location?: string;
  gender?: string;
  kyc_status?: string;
  profile_details?: Record<string, unknown> | null;
};

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return false;
}

function sectionPercentage(filled: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

function statusFromRatio(filled: number, total: number): SectionStatus {
  if (filled === 0) return "empty";
  if (filled >= total) return "complete";
  return "partial";
}

function strengthLabel(percentage: number): ProfileCompletionResult["strength"] {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 60) return "Strong";
  if (percentage >= 40) return "Average";
  return "Weak";
}

function evaluateBasic(user: ProfileUser, basic: Record<string, unknown>) {
  const checks = [
    { field: "name", ok: isFilled(basic.name) || isFilled(user.first_name) },
    { field: "height", ok: isFilled(basic.height) },
    { field: "maritalStatus", ok: isFilled(basic.maritalStatus) },
    { field: "aboutMe", ok: isFilled(basic.aboutMe) },
    {
      field: "presentLocation",
      ok: isFilled(basic.presentLocation) || isFilled(basic.location) || isFilled(user.location),
    },
    { field: "gender", ok: isFilled(basic.gender) || isFilled(user.gender) },
    { field: "motherTongue", ok: isFilled(basic.motherTongue) },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const requiredForComplete = ["name", "height", "maritalStatus", "aboutMe", "presentLocation"];
  const isComplete = requiredForComplete.every((f) => checks.find((c) => c.field === f)?.ok);
  return {
    missingFields: checks.filter((c) => !c.ok).map((c) => c.field),
    status: (isComplete ? "complete" : statusFromRatio(filled, checks.length)) as SectionStatus,
    percentage: isComplete ? 100 : sectionPercentage(filled, checks.length),
  };
}

function evaluateReligious(user: ProfileUser, religious: Record<string, unknown>) {
  const checks = [
    { field: "namaz", ok: isFilled(religious.namaz) },
    { field: "religiousness", ok: isFilled(religious.religiousness) },
    { field: "community", ok: isFilled(religious.community) || isFilled(user.cast) },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const isComplete = checks[0].ok && checks[1].ok;
  return {
    missingFields: checks.filter((c) => !c.ok).map((c) => c.field),
    status: (isComplete ? "complete" : statusFromRatio(filled, checks.length)) as SectionStatus,
    percentage: isComplete ? 100 : sectionPercentage(filled, checks.length),
  };
}

function evaluateProfessional(professional: Record<string, unknown>) {
  const education = professional.education || professional.highestEducation;
  const checks = [
    { field: "education", ok: isFilled(education) || isFilled(professional.customEducation) },
    { field: "profession", ok: isFilled(professional.profession) },
    { field: "annualIncome", ok: isFilled(professional.annualIncome) },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const isComplete = checks[0].ok && checks[1].ok;
  return {
    missingFields: checks.filter((c) => !c.ok).map((c) => c.field),
    status: (isComplete ? "complete" : statusFromRatio(filled, checks.length)) as SectionStatus,
    percentage: isComplete ? 100 : sectionPercentage(filled, checks.length),
  };
}

function evaluateFamily(family: Record<string, unknown>) {
  const familyType = family.familyType || family.familyStatus;
  const checks = [
    { field: "familyType", ok: isFilled(familyType) },
    { field: "financialStatus", ok: isFilled(family.financialStatus) },
    { field: "fatherOccupation", ok: isFilled(family.fatherOccupation) || isFilled(family.fatherName) },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const isComplete = checks[0].ok && checks[1].ok;
  return {
    missingFields: checks.filter((c) => !c.ok).map((c) => c.field),
    status: (isComplete ? "complete" : statusFromRatio(filled, checks.length)) as SectionStatus,
    percentage: isComplete ? 100 : sectionPercentage(filled, checks.length),
  };
}

function evaluateInterests(interests: Record<string, unknown>) {
  const list = interests.interests;
  const hasList = Array.isArray(list) && list.length > 0;
  const hasDesc = isFilled(interests.personalityDescription) || isFilled(interests.aboutMe);
  const checks = [
    { field: "interests", ok: hasList },
    { field: "personalityDescription", ok: hasDesc },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const isComplete = hasList || hasDesc;
  return {
    missingFields: checks.filter((c) => !c.ok).map((c) => c.field),
    status: (isComplete ? "complete" : statusFromRatio(filled, checks.length)) as SectionStatus,
    percentage: isComplete ? 100 : sectionPercentage(filled, checks.length),
  };
}

function evaluateHabits(habits: Record<string, unknown>) {
  const checks = [
    { field: "eatingHabits", ok: isFilled(habits.eatingHabits) },
    { field: "smokingHabits", ok: isFilled(habits.smokingHabits) },
    { field: "drinkingHabits", ok: isFilled(habits.drinkingHabits) },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const isComplete = filled > 0;
  return {
    missingFields: checks.filter((c) => !c.ok).map((c) => c.field),
    status: (isComplete ? "complete" : statusFromRatio(filled, checks.length)) as SectionStatus,
    percentage: isComplete ? 100 : sectionPercentage(filled, checks.length),
  };
}

function evaluatePartner(partner: Record<string, unknown>) {
  const checks = [
    { field: "minAge", ok: isFilled(partner.minAge) || isFilled(partner.prefAgeMin) },
    { field: "maxAge", ok: isFilled(partner.maxAge) || isFilled(partner.prefAgeMax) },
    { field: "aboutPartner", ok: isFilled(partner.aboutPartner) },
    { field: "religion", ok: isFilled(partner.religion) || isFilled(partner.preferredReligion) },
    { field: "maritalStatus", ok: isFilled(partner.maritalStatus) || isFilled(partner.preferredMaritalStatus) },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const isComplete =
    (checks[0].ok && checks[1].ok) || checks[2].ok || (checks[3].ok && checks[4].ok);
  return {
    missingFields: checks.filter((c) => !c.ok).map((c) => c.field),
    status: (isComplete ? "complete" : statusFromRatio(filled, checks.length)) as SectionStatus,
    percentage: isComplete ? 100 : sectionPercentage(filled, checks.length),
  };
}

function evaluatePhotos(photosDraft: Record<string, unknown>) {
  const photos = photosDraft.photos;
  const count = Array.isArray(photos) ? photos.length : 0;
  const isComplete = count > 0;
  return {
    missingFields: isComplete ? [] : ["photos"],
    status: (isComplete ? "complete" : "empty") as SectionStatus,
    percentage: isComplete ? 100 : 0,
  };
}

function evaluateVoice(voiceDraft: Record<string, unknown>) {
  const voice = voiceDraft.voice as Record<string, unknown> | undefined;
  const isComplete = isFilled(voice?.dataUrl) || isFilled(voiceDraft.dataUrl);
  return {
    missingFields: isComplete ? [] : ["voice"],
    status: (isComplete ? "complete" : "empty") as SectionStatus,
    percentage: isComplete ? 100 : 0,
  };
}

function evaluateKyc(user: ProfileUser) {
  const status = user.kyc_status || "NOT_SUBMITTED";
  const isComplete = ["VERIFIED", "PENDING", "UNDER_REVIEW"].includes(status);
  return {
    missingFields: isComplete ? [] : ["kyc_status"],
    status: (isComplete ? "complete" : status === "REJECTED" ? "partial" : "empty") as SectionStatus,
    percentage: status === "VERIFIED" ? 100 : isComplete ? 75 : 0,
  };
}

export const PROFILE_SECTION_REGISTRY = [
  {
    id: "basic",
    name: "Basic Details",
    draftKey: "mn_basic_details_draft",
    weight: 20,
    step: 1,
    suggestion: "Add your height, marital status, and about me.",
    evaluate: (u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluateBasic(u, d.mn_basic_details_draft || {}),
  },
  {
    id: "religious",
    name: "Religious Info",
    draftKey: "mn_religious_info_draft",
    weight: 15,
    step: 2,
    suggestion: "Add your prayer habits and religiousness.",
    evaluate: (u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluateReligious(u, d.mn_religious_info_draft || {}),
  },
  {
    id: "professional",
    name: "Professional Info",
    draftKey: "mn_professional_info_draft",
    weight: 15,
    step: 3,
    suggestion: "Add your education and profession.",
    evaluate: (_u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluateProfessional(d.mn_professional_info_draft || {}),
  },
  {
    id: "family",
    name: "Family Details",
    draftKey: "mn_family_details_draft",
    weight: 10,
    step: 4,
    suggestion: "Tell us about your family background.",
    evaluate: (_u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluateFamily(d.mn_family_details_draft || {}),
  },
  {
    id: "interests",
    name: "Interests & Personality",
    draftKey: "mn_interests_draft",
    weight: 5,
    step: 5,
    suggestion: "Add interests to find like-minded matches.",
    evaluate: (_u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluateInterests(d.mn_interests_draft || {}),
  },
  {
    id: "habits",
    name: "Hobbies & Habits",
    draftKey: "mn_habits_draft",
    weight: 5,
    step: 6,
    suggestion: "Add your lifestyle habits.",
    evaluate: (_u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluateHabits(d.mn_habits_draft || {}),
  },
  {
    id: "partner-preferences",
    name: "Partner Preferences",
    draftKey: "mn_partner_preferences_draft",
    weight: 15,
    step: 7,
    suggestion: "Complete partner preferences to improve match suggestions.",
    evaluate: (_u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluatePartner(d.mn_partner_preferences_draft || {}),
  },
  {
    id: "photos",
    name: "Profile Photos",
    draftKey: "mn_profile_photos_draft",
    weight: 10,
    step: 8,
    suggestion: "Upload at least one profile photo.",
    evaluate: (_u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluatePhotos(d.mn_profile_photos_draft || {}),
  },
  {
    id: "voice",
    name: "Voice Introduction",
    draftKey: "mn_voice_intro_draft",
    weight: 5,
    step: 9,
    suggestion: "Record a voice intro to boost responses.",
    evaluate: (_u: ProfileUser, d: Record<string, Record<string, unknown>>) =>
      evaluateVoice(d.mn_voice_intro_draft || {}),
  },
] as const;

export const KYC_SECTION = {
  id: "kyc",
  name: "Identity Verification",
  draftKey: "kyc_status",
  weight: 10,
  step: 10,
  suggestion: "Verify your identity to get the ID Verified badge.",
};

export const SECTION_SLUG_TO_DRAFT: Record<string, string> = {
  basic: "mn_basic_details_draft",
  religious: "mn_religious_info_draft",
  professional: "mn_professional_info_draft",
  family: "mn_family_details_draft",
  interests: "mn_interests_draft",
  habits: "mn_habits_draft",
  "partner-preferences": "mn_partner_preferences_draft",
  photos: "mn_profile_photos_draft",
  voice: "mn_voice_intro_draft",
};

export function calculateProfileCompletion(user: ProfileUser): ProfileCompletionResult {
  const details = (user.profile_details || {}) as Record<string, Record<string, unknown>>;
  const isFemale = (user.gender || "").toLowerCase() === "female";

  const sections: ProfileSectionCompletion[] = [];

  for (const def of PROFILE_SECTION_REGISTRY) {
    const result = def.evaluate(user, details);
    sections.push({
      id: def.id,
      name: def.name,
      draftKey: def.draftKey,
      weight: def.weight,
      step: def.step,
      status: result.status,
      percentage: result.percentage,
      missingFields: result.missingFields,
      suggestion: def.suggestion,
    });
  }

  if (!isFemale) {
    const kycResult = evaluateKyc(user);
    sections.push({
      id: KYC_SECTION.id,
      name: KYC_SECTION.name,
      draftKey: KYC_SECTION.draftKey,
      weight: KYC_SECTION.weight,
      step: KYC_SECTION.step,
      status: kycResult.status,
      percentage: kycResult.percentage,
      missingFields: kycResult.missingFields,
      suggestion: KYC_SECTION.suggestion,
    });
  }

  let earnedWeight = 0;
  let totalWeight = 0;

  for (const section of sections) {
    totalWeight += section.weight;
    if (section.status === "complete") {
      earnedWeight += section.weight;
    } else if (section.status === "partial") {
      earnedWeight += Math.round(section.weight * (section.percentage / 100));
    }
  }

  const percentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const completedSections = sections.filter((s) => s.status === "complete").length;
  const incompleteSections = sections.filter((s) => s.status !== "complete");

  return {
    percentage,
    strength: strengthLabel(percentage),
    completedSections,
    totalSections: sections.length,
    sections,
    incompleteSections,
  };
}

export function averageProfileCompletion(users: ProfileUser[]): number {
  if (users.length === 0) return 0;
  const sum = users.reduce((acc, u) => acc + calculateProfileCompletion(u).percentage, 0);
  return Math.round(sum / users.length);
}
