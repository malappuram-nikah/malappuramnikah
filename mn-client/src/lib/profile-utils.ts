export function getEnrichedProfile(u: any) {
  const profileDetails = u.profile_details || {};
  const basic = profileDetails.mn_basic_details_draft || {};
  const religious = profileDetails.mn_religious_info_draft || {};
  const professional = profileDetails.mn_professional_info_draft || {};
  const family = profileDetails.mn_family_details_draft || {};
  const interests = profileDetails.mn_interests_draft || {};
  const habits = profileDetails.mn_habits_draft || {};
  const partner = profileDetails.mn_partner_preferences_draft || {};

  const parseHobbies = (val: any, fallback: string[]) => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      return val.split(",").map(s => s.trim()).filter(Boolean);
    }
    return fallback;
  };
  
  // Resolve avatar photo
  let avatar = `https://i.pravatar.cc/200?img=${45 + (u.id % 20)}`;
  const photos = profileDetails.mn_profile_photos_draft?.photos;
  if (photos && photos.length > 0) {
    const primary = photos.find((p: any) => p.isPrimary);
    avatar = primary ? primary.dataUrl : photos[0].dataUrl;
  }

  const age = u.dob ? Math.floor((new Date().getTime() - new Date(u.dob).getTime()) / 31557600000) : 25;
  const caste = u.cast || "Sunni";

  return {
    id: u.id,
    name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Member",
    photo: avatar,
    gender: basic.gender || u.gender || "Female",
    location: basic.presentLocation || u.location || "Malappuram",
    aboutMe: basic.aboutMe || "Looking for a pious, family-oriented partner with shared values.",
    
    // Core Header fields
    profileId: `MN-${100000 + u.id}`,
    age: basic.age ? parseInt(basic.age) : age,
    height: basic.height || "Not Specified",
    education: (professional.education === "Others" && professional.customEducation) ? professional.customEducation : (professional.education || "Not Specified"),
    profession: professional.profession || "Not Specified",
    religion: religious.religion || "Islam",
    community: religious.community || caste,
    maritalStatus: basic.maritalStatus || "Never Married",
    profileFor: basic.profileFor || u.profile_for || "Myself",

    // Section 1: Basic Details
    motherTongue: basic.motherTongue || "Malayalam",
    physicalStatus: basic.physicalStatus || "Normal",
    appearance: basic.appearance || "Not Specified",
    weight: basic.weight ? (String(basic.weight).includes("kg") ? basic.weight : `${basic.weight} kg`) : "Not Specified",
    languagesSpoken: basic.languagesSpoken || "Not Specified",
    presentLocation: basic.presentLocation || u.location || "Malappuram",
    marriageGoalPlan: basic.marriageGoalPlan || "Not Specified",
    relocateForPartner: basic.relocateForPartner || "Not Specified",

    // Section 2: Religious Info
    religiousness: religious.religiousness || "Not Specified",
    namaz: religious.namaz || "Not Specified",
    quranReading: religious.quranReading || "Not Specified",

    // Section 3: Professional Info
    educationalInstitution: professional.educationalInstitution || "Not Specified",
    companyName: professional.companyName || "Not Specified",
    professionType: professional.professionType || "Not Specified",
    annualIncome: professional.annualIncome || "Not Specified",

    // Section 4: Family Details
    familyType: family.familyType || "Not Specified",
    financialStatus: family.financialStatus || "Not Specified",
    familyValues: family.familyValues || "Not Specified",
    fatherOccupation: family.fatherOccupation || "Not Specified",
    motherOccupation: family.motherOccupation || "Not Specified",
    siblingsCount: family.siblingsCount || "Not Specified",

    // Section 5: Interests & Personality
    interestsList: interests.interests || [],
    personalityDescription: interests.aboutMe || "Not Specified",

    // Section 6: Hobbies & Habits
    favouriteSports: parseHobbies(habits.favouriteSports, []),
    favouritePlaces: parseHobbies(habits.favouritePlaces, []),
    eatingHabits: habits.eatingHabits || "Not Specified",
    smokingHabits: habits.smokingHabits || "Not Specified",
    drinkingHabits: habits.drinkingHabits || "Not Specified",

    // Section 7: Partner Preferences
    aboutPartner: partner.aboutPartner || "Not Specified",
    prefAge: (partner.minAge && partner.maxAge) ? `${partner.minAge} to ${partner.maxAge} Yrs` : "Not Specified",
    prefHeight: (partner.minHeight && partner.maxHeight) ? `${partner.minHeight} to ${partner.maxHeight}` : (partner.preferredHeight || "Not Specified"),
    prefMaritalStatus: partner.maritalStatus || partner.preferredMaritalStatus || "Not Specified",
    prefReligion: partner.religion || partner.preferredReligion || "Not Specified",
    prefCommunity: partner.community || partner.preferredCommunity || "Not Specified",
    prefEducation: partner.education || partner.preferredEducation || "Not Specified",
    prefOccupation: partner.occupation || partner.preferredOccupation || "Not Specified",
    prefLocations: partner.preferredLocations || "Not Specified",
    prefNamaz: partner.prefNamaz || "Not Specified",
    prefQuranReading: partner.prefQuranReading || "Not Specified"
  };
}

export function analyzeMatch(profile: any, myPref: any) {
  const age = profile.age;
  const prefMinAge = myPref?.minAge ? parseInt(myPref.minAge) : 20;
  const prefMaxAge = myPref?.maxAge ? parseInt(myPref.maxAge) : 30;
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
