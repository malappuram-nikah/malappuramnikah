import { User, EnrichedProfile, ProfileDetails } from "@/types";

export function calculateAge(dobInput: any): number {
  if (!dobInput) return 0;
  let birthDate: Date | null = null;

  if (typeof dobInput === "string") {
    const cleanStr = dobInput.trim();
    const parts = cleanStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
        birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    if (!birthDate || isNaN(birthDate.getTime())) {
      birthDate = new Date(cleanStr);
    }
  } else if (dobInput instanceof Date) {
    birthDate = dobInput;
  }

  if (!birthDate || isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let calculated = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    calculated--;
  }
  return calculated > 0 && calculated < 120 ? calculated : 0;
}

export function getEnrichedProfile(u: User): EnrichedProfile {
  const profileDetails = u.profile_details || {};
  const basic = profileDetails.mn_basic_details_draft || {};
  const religious = profileDetails.mn_religious_info_draft || {};
  const professional = profileDetails.mn_professional_info_draft || {};
  const family = profileDetails.mn_family_details_draft || {};
  const interests = profileDetails.mn_interests_draft || {};
  const habits = profileDetails.mn_habits_draft || {};
  const partner = profileDetails.mn_partner_preferences_draft || {};

  const parseHobbies = (val: any, fallback: string[]): string[] => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      return val.split(",").map(s => s.trim()).filter(Boolean);
    }
    return fallback;
  };
  
  // Resolve avatar photo
  let avatar = "";
  const photos = profileDetails.mn_profile_photos_draft?.photos;
  if (photos && photos.length > 0) {
    const primary = photos.find((p) => p.isPrimary);
    avatar = primary ? primary.dataUrl : photos[0].dataUrl;
  }

  const computedAge = calculateAge(u.dob || (basic as any).dob || (u as any).dateOfBirth);
  const caste = u.cast || "";

  return {
    id: u.id,
    uuid: u.uuid || (u as any).uuid || "",
    name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "",
    photo: avatar,
    gender: basic.gender || u.gender || "",
    location: basic.presentLocation || u.location || "",
    aboutMe: basic.aboutMe || "",
    
    // Core Header fields
    profileId: `MN-${100000 + u.id}`,
    age: basic.age ? parseInt(basic.age, 10) : (computedAge || 0),
    height: basic.height || "",
    education: (professional.education === "Others" && professional.customEducation) ? professional.customEducation : (professional.education || ""),
    profession: professional.profession || "",
    religion: religious.religion || "",
    community: religious.community || caste,
    maritalStatus: basic.maritalStatus || "",
    profileFor: basic.profileFor || u.profile_for || "",

    // Section 1: Basic Details
    motherTongue: basic.motherTongue || "",
    physicalStatus: basic.physicalStatus || "",
    appearance: basic.appearance || "",
    weight: basic.weight ? (String(basic.weight).includes("kg") ? String(basic.weight) : `${basic.weight} kg`) : "",
    languagesSpoken: basic.languagesSpoken || "",
    presentLocation: basic.presentLocation || u.location || "",
    marriageGoalPlan: basic.marriageGoalPlan || "",
    relocateForPartner: basic.relocateForPartner || "",

    // Section 2: Religious Info
    religiousness: religious.religiousness || "",
    namaz: religious.namaz || "",
    quranReading: religious.quranReading || "",

    // Section 3: Professional Info
    educationalInstitution: professional.educationalInstitution || "",
    companyName: professional.companyName || "",
    professionType: professional.professionType || "",
    annualIncome: professional.annualIncome || "",

    // Section 4: Family Details
    familyType: family.familyType || "",
    financialStatus: family.financialStatus || "",
    familyValues: family.familyValues || "",
    fatherOccupation: family.fatherOccupation || "",
    motherOccupation: family.motherOccupation || "",
    siblingsCount: family.siblingsCount || "",

    // Section 5: Interests & Personality
    interestsList: interests.interests || [],
    personalityDescription: interests.aboutMe || "",

    // Section 6: Hobbies & Habits
    favouriteSports: parseHobbies(habits.favouriteSports, []),
    favouritePlaces: parseHobbies(habits.favouritePlaces, []),
    eatingHabits: habits.eatingHabits || "",
    smokingHabits: habits.smokingHabits || "",
    drinkingHabits: habits.drinkingHabits || "",

    // Section 7: Partner Preferences
    aboutPartner: partner.aboutPartner || "",
    prefAge: (partner.minAge && partner.maxAge) ? `${partner.minAge} to ${partner.maxAge} Yrs` : "",
    prefHeight: (partner.minHeight && partner.maxHeight) ? `${partner.minHeight} to ${partner.maxHeight}` : (partner.preferredHeight || ""),
    prefMaritalStatus: partner.maritalStatus || partner.preferredMaritalStatus || "",
    prefReligion: partner.religion || partner.preferredReligion || "",
    prefCommunity: partner.community || partner.preferredCommunity || "",
    prefEducation: partner.education || partner.preferredEducation || "",
    prefOccupation: partner.occupation || partner.preferredOccupation || "",
    prefLocations: partner.preferredLocations || "",
    prefNamaz: partner.prefNamaz || "",
    prefQuranReading: partner.prefQuranReading || ""
  };
}

export function analyzeMatch(profile: EnrichedProfile, myPref: ProfileDetails["mn_partner_preferences_draft"]) {
  const age = profile.age;
  const prefMinAge = myPref?.minAge ? parseInt(String(myPref.minAge), 10) : 20;
  const prefMaxAge = myPref?.maxAge ? parseInt(String(myPref.maxAge), 10) : 30;
  const ageMatch = age >= prefMinAge && age <= prefMaxAge;
  
  const maritalMatch = !myPref?.maritalStatus || myPref.maritalStatus === "Any" || myPref.maritalStatus === profile.maritalStatus;
  
  const religionMatch = !myPref?.religion || myPref.religion === "Any" || myPref.religion.toLowerCase() === profile.religion.toLowerCase();
  
  const communityMatch = !myPref?.community || myPref.community === "Any" || profile.community.toLowerCase().includes(myPref.community.toLowerCase());
  
  const locationMatch = !myPref?.preferredLocations || myPref.preferredLocations === "Any" || myPref.preferredLocations.includes("All Kerala") || myPref.preferredLocations.toLowerCase().includes(profile.location.toLowerCase()) || profile.location.toLowerCase().includes(myPref.preferredLocations.toLowerCase());

  const educationMatch = !myPref?.education || myPref.education === "Any" || profile.education.toLowerCase().includes(myPref.education.toLowerCase()) || myPref.education.toLowerCase().includes(profile.education.toLowerCase());

  const namazMatch = !myPref?.prefNamaz || myPref.prefNamaz === "Any" || myPref.prefNamaz.toLowerCase() === (profile.namaz || "").toLowerCase();

  const quranMatch = !myPref?.prefQuranReading || myPref.prefQuranReading === "Any" || myPref.prefQuranReading.toLowerCase() === (profile.quranReading || "").toLowerCase();

  // Calculate score
  let score = 50; // base score
  if (ageMatch) score += 8;
  if (maritalMatch) score += 8;
  if (religionMatch) score += 7;
  if (communityMatch) score += 7;
  if (locationMatch) score += 6;
  if (educationMatch) score += 6;
  if (namazMatch) score += 4;
  if (quranMatch) score += 4;

  // Let's ensure there's some realistic variance
  score = Math.min(Math.max(score + (profile.id % 7), 40), 98);

  let indicator = "Average Match";
  if (score >= 85) indicator = "Excellent Match";
  else if (score >= 70) indicator = "Good Match";
  else if (score >= 55) indicator = "Average Match";
  else indicator = "Low Match";

  return {
    score,
    indicator,
    fields: {
      age: ageMatch ? "strong" : "mismatch",
      maritalStatus: maritalMatch ? "strong" : "mismatch",
      religion: religionMatch ? "strong" : "mismatch",
      community: communityMatch ? "strong" : "mismatch",
      location: locationMatch ? "strong" : "acceptable",
      education: educationMatch ? "strong" : "acceptable",
      namaz: namazMatch ? "strong" : "acceptable",
      quranReading: quranMatch ? "strong" : "acceptable"
    }
  };
}

export interface SectionInfo {
  key: string;
  name: string;
  suggestion: string;
  step: number;
  weight: number;
}

export interface ProfileCompletionResult {
  percentage: number;
  strength: "Weak" | "Average" | "Strong" | "Excellent";
  strengthColor: string;
  completedSteps: number[];
  totalSteps: number;
  isComplete: boolean;
  missingSections: SectionInfo[];
  earnedWeight: number;
  totalWeight: number;
}

export function getProfileCompletionStatus(u: any): ProfileCompletionResult {
  if (!u) {
    return {
      percentage: 0,
      strength: "Weak",
      strengthColor: "text-rose-200 bg-rose-950/40 border-rose-800/30",
      completedSteps: [],
      totalSteps: 12,
      isComplete: false,
      missingSections: [],
      earnedWeight: 0,
      totalWeight: 100,
    };
  }

  const details = u.profile_details || {};

  const getDraft = (key: string) => {
    let data = details[key];
    if ((!data || Object.keys(data).length === 0) && typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(key);
        if (item) data = JSON.parse(item);
      } catch {
        data = null;
      }
    }
    return data || {};
  };

  const isFemale = (u.gender || getDraft("mn_basic_details_draft").gender || "").toLowerCase() === "female";

  const sectionDefinitions = [
    {
      key: "mn_basic_details_draft",
      name: "Basic Details",
      suggestion: "Add your height, marital status, and location.",
      step: 1,
      weight: 20,
      check: () => {
        const b = getDraft("mn_basic_details_draft");
        return Boolean(
          (b.height || b.maritalStatus || b.presentLocation) &&
          (u.first_name || b.aboutMe || b.name || u.dob || b.dob)
        );
      },
    },
    {
      key: "mn_religious_info_draft",
      name: "Religious Info",
      suggestion: "Add your prayer habits and religiousness.",
      step: 2,
      weight: 15,
      check: () => {
        const r = getDraft("mn_religious_info_draft");
        return Boolean(r.religion || r.community || u.cast || r.namaz || r.religiousness);
      },
    },
    {
      key: "mn_professional_info_draft",
      name: "Professional Info",
      suggestion: "Add your education and profession.",
      step: 3,
      weight: 15,
      check: () => {
        const p = getDraft("mn_professional_info_draft");
        return Boolean(p.education || p.highestEducation || p.profession || p.professionType || p.companyName || p.educationalInstitution);
      },
    },
    {
      key: "mn_family_details_draft",
      name: "Family Details",
      suggestion: "Tell us about your family background.",
      step: 4,
      weight: 10,
      check: () => {
        const f = getDraft("mn_family_details_draft");
        return Boolean(f.familyType || f.familyStatus || f.financialStatus || f.fatherOccupation || f.motherOccupation || f.fatherName || f.motherName);
      },
    },
    {
      key: "mn_interests_draft",
      name: "Interests & Personality",
      suggestion: "Complete Interests & Personality to find like-minded matches.",
      step: 5,
      weight: 5,
      check: () => {
        const i = getDraft("mn_interests_draft");
        return Boolean((i.interests && i.interests.length > 0) || i.personalityDescription || i.aboutMe);
      },
    },
    {
      key: "mn_habits_draft",
      name: "Hobbies & Habits",
      suggestion: "Add your lifestyle habits and hobbies.",
      step: 6,
      weight: 5,
      check: () => {
        const h = getDraft("mn_habits_draft");
        return Boolean((h.favouriteSports && h.favouriteSports.length > 0) || (h.favouritePlaces && h.favouritePlaces.length > 0) || h.eatingHabits || h.smokingHabits || h.drinkingHabits);
      },
    },
    {
      key: "mn_partner_preferences_draft",
      name: "Partner Preferences",
      suggestion: "Complete Partner Preferences to improve match suggestions.",
      step: 7,
      weight: 15,
      check: () => {
        const p = getDraft("mn_partner_preferences_draft");
        return Boolean(p.aboutPartner || p.religion || p.preferredReligion || p.minAge || p.prefAgeMin || p.maritalStatus || p.preferredMaritalStatus || p.education || p.preferredEducation);
      },
    },
    {
      key: "mn_profile_photos_draft",
      name: "Profile Photos",
      suggestion: "Upload profile photos to improve visibility.",
      step: 8,
      weight: 10,
      check: () => {
        const photosDraft = getDraft("mn_profile_photos_draft");
        const photos = photosDraft?.photos || details.mn_profile_photos_draft?.photos;
        return Boolean(photos && photos.length > 0);
      },
    },
    {
      key: "mn_voice_intro_draft",
      name: "Voice Introduction",
      suggestion: "Record a voice intro to boost responses.",
      step: 9,
      weight: 5,
      check: () => {
        const voiceDraft = getDraft("mn_voice_intro_draft");
        const voice = voiceDraft?.voice || voiceDraft?.dataUrl || details.mn_voice_intro_draft?.voice;
        return Boolean(voice || (typeof voiceDraft === "object" && Object.keys(voiceDraft).length > 0 && (voiceDraft.audioUrl || voiceDraft.url)));
      },
    },
    ...(isFemale ? [] : [
      {
        key: "mn_kyc_status",
        name: "Identity Verification",
        suggestion: "Verify your identity to get the 'ID Verified' badge.",
        step: 10,
        weight: 10,
        check: () => {
          const localKyc = typeof window !== "undefined" ? localStorage.getItem("mn_kyc_status") : null;
          return Boolean(
            u.is_verified ||
            u.kyc_status === "VERIFIED" ||
            u.kyc_status === "PENDING" ||
            u.kyc_status === "UNDER_REVIEW" ||
            localKyc === "VERIFIED" ||
            localKyc === "PENDING" ||
            localKyc === "UNDER_REVIEW" ||
            details.mn_identity_draft
          );
        },
      },
    ]),
  ];

  let earnedWeight = 0;
  let totalWeight = 0;
  const completedSteps: number[] = [];
  const missingSections: SectionInfo[] = [];

  sectionDefinitions.forEach((sec) => {
    totalWeight += sec.weight;
    if (sec.check()) {
      earnedWeight += sec.weight;
      completedSteps.push(sec.step);
    } else {
      missingSections.push({
        key: sec.key,
        name: sec.name,
        suggestion: sec.suggestion,
        step: sec.step,
        weight: sec.weight,
      });
    }
  });

  // Step 11 (Final Review) & Step 12 (Completion)
  if (completedSteps.length >= 8) completedSteps.push(11);
  if (completedSteps.length >= sectionDefinitions.length) completedSteps.push(12);

  // Sort missing sections by weight descending (highest priority missing first)
  missingSections.sort((a, b) => b.weight - a.weight);

  const percentage = Math.min(100, Math.max(0, Math.round((earnedWeight / totalWeight) * 100)));
  const isComplete = percentage >= 85 || completedSteps.length >= sectionDefinitions.length;

  let strength: "Weak" | "Average" | "Strong" | "Excellent" = "Weak";
  let strengthColor = "text-rose-200 bg-rose-950/40 border-rose-800/30";

  if (percentage >= 80) {
    strength = "Excellent";
    strengthColor = "text-emerald-200 bg-emerald-950/40 border-emerald-800/30";
  } else if (percentage >= 60) {
    strength = "Strong";
    strengthColor = "text-teal-200 bg-teal-950/40 border-teal-800/30";
  } else if (percentage >= 40) {
    strength = "Average";
    strengthColor = "text-amber-200 bg-amber-950/40 border-amber-800/30";
  }

  return {
    percentage,
    strength,
    strengthColor,
    completedSteps,
    totalSteps: 12,
    isComplete,
    missingSections,
    earnedWeight,
    totalWeight,
  };
}

export async function saveProfileSection(sectionKey: string, sectionData: any): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  try {
    // 1. Instantly update localStorage draft
    localStorage.setItem(sectionKey, typeof sectionData === "string" ? sectionData : JSON.stringify(sectionData));

    // 2. Sync to Backend Database via PUT /user/:id/profile
    const token = localStorage.getItem("mn_token");
    if (!token) return true;

    let userId: number | null = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.userId) userId = Number(payload.userId);
    } catch (e) {
      console.error("Token decoding error in saveProfileSection:", e);
    }

    if (!userId) return true;

    const { API_URL } = await import("@/lib/config");

    const draftKeys = [
      "mn_basic_details_draft",
      "mn_religious_info_draft",
      "mn_professional_info_draft",
      "mn_family_details_draft",
      "mn_interests_draft",
      "mn_habits_draft",
      "mn_partner_preferences_draft",
      "mn_profile_photos_draft",
      "mn_voice_intro_draft",
    ];

    const allDrafts: Record<string, any> = {};
    draftKeys.forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          allDrafts[key] = JSON.parse(item);
        } catch {
          allDrafts[key] = item;
        }
      }
    });
    allDrafts[sectionKey] = sectionData;

    const res = await fetch(`${API_URL}/user/${userId}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profile_details: allDrafts }),
    });

    if (res.ok) {
      console.log(`[PROFILE SYNC SUCCESS] Section ${sectionKey} synced to DB for user #${userId}`);
      return true;
    } else {
      console.warn(`[PROFILE SYNC WARN] Server returned ${res.status} when syncing ${sectionKey}`);
      return false;
    }
  } catch (err) {
    console.error(`[PROFILE SYNC ERROR] Failed to sync ${sectionKey}:`, err);
    return false;
  }
}

