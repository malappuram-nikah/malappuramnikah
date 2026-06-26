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
    name: `${u.first_name} ${u.last_name}`,
    photo: avatar,
    gender: u.gender || "Female",
    location: basic.presentLocation || u.location || "Malappuram",
    aboutMe: basic.aboutMe || "Looking for a pious, family-oriented partner with shared values.",
    
    // Core Header fields
    profileId: `MN-${100000 + u.id}`,
    age: basic.age ? parseInt(basic.age) : age,
    height: basic.height || "5 ft 4 in (162 cm)",
    education: (professional.education === "Others" && professional.customEducation) ? professional.customEducation : (professional.education || "Bachelor's Degree"),
    profession: professional.profession || "Software Professional",
    religion: religious.religion || "Islam",
    community: religious.community || caste,
    maritalStatus: basic.maritalStatus || "Never Married",

    // Section 1: Basic Details
    motherTongue: basic.motherTongue || "Malayalam",
    physicalStatus: basic.physicalStatus || "Normal",
    appearance: basic.appearance || "Fair",
    weight: basic.weight || "58 kg",
    languagesSpoken: basic.languagesSpoken || "Malayalam, English",
    presentLocation: basic.presentLocation || u.location || "Malappuram",
    marriageGoalPlan: basic.marriageGoalPlan || "Flexible / No rush",
    relocateForPartner: basic.relocateForPartner || "Maybe / Open to discussion",

    // Section 2: Religious Info
    religiousness: religious.religiousness || "Moderately Religious",
    namaz: religious.namaz || "Five Times Daily",
    quranReading: religious.quranReading || "Daily",

    // Section 3: Professional Info
    educationalInstitution: professional.educationalInstitution || "Calicut University",
    companyName: professional.companyName || "Tech Solutions",
    professionType: professional.professionType || "Private Sector",
    annualIncome: professional.annualIncome || "INR 8,00,000",

    // Section 4: Family Details
    familyType: family.familyType || "Nuclear Family",
    financialStatus: family.financialStatus || "Middle Class",
    familyValues: family.familyValues || "Moderate",
    fatherOccupation: family.fatherOccupation || "Businessman",
    motherOccupation: family.motherOccupation || "Homemaker",
    siblingsCount: family.siblingsCount || "2",

    // Section 5: Interests & Personality
    interestsList: interests.interests || ["Reading", "Cooking", "Islamic Lectures"],
    personalityDescription: interests.aboutMe || "A balance of modern outlook and Islamic values. Looking for a partner who is family-oriented and respectful.",

    // Section 6: Hobbies & Habits
    favouriteSports: parseHobbies(habits.favouriteSports, ["Badminton"]),
    favouritePlaces: parseHobbies(habits.favouritePlaces, ["Munnar", "Wayanad"]),
    eatingHabits: habits.eatingHabits || "Non-Vegetarian",
    smokingHabits: habits.smokingHabits || "No",
    drinkingHabits: habits.drinkingHabits || "No",

    // Section 7: Partner Preferences
    aboutPartner: partner.aboutPartner || "Looking for an educated, religious partner with good family values.",
    prefAge: (partner.minAge && partner.maxAge) ? `${partner.minAge} to ${partner.maxAge} Yrs` : "22 to 28 Yrs",
    prefHeight: partner.preferredHeight || "5 ft 2 in to 5 ft 8 in",
    prefMaritalStatus: partner.preferredMaritalStatus || "Never Married",
    prefReligion: partner.preferredReligion || "Islam",
    prefCommunity: partner.preferredCommunity || "Sunni",
    prefEducation: partner.preferredEducation || "Graduation / Post Graduation",
    prefOccupation: partner.preferredOccupation || "Any Profession",
    prefLocations: partner.preferredLocations || "Malappuram, Manjeri, Calicut",
    prefNamaz: partner.prefNamaz || "Any",
    prefQuranReading: partner.prefQuranReading || "Any"
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
