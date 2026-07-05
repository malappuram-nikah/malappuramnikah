import { User, EnrichedProfile, ProfileDetails } from "@/types";

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

  const age = u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 0;
  const caste = u.cast || "";

  return {
    id: u.id,
    name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "",
    photo: avatar,
    gender: basic.gender || u.gender || "",
    location: basic.presentLocation || u.location || "",
    aboutMe: basic.aboutMe || "",
    
    // Core Header fields
    profileId: `MN-${100000 + u.id}`,
    age: basic.age ? parseInt(basic.age, 10) : (age || 0),
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
  
  const locationMatch = !myPref?.preferredLocations || myPref.preferredLocations === "Any" || myPref.preferredLocations.toLowerCase().includes(profile.location.toLowerCase()) || profile.location.toLowerCase().includes(myPref.preferredLocations.toLowerCase());

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
