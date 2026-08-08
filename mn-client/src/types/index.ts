export interface Photo {
  id: string;
  dataUrl: string;
  isPrimary?: boolean;
}

export interface ProfileDetails {
  mn_basic_details_draft?: {
    name?: string;
    profileFor?: string;
    gender?: string;
    location?: string;
    presentLocation?: string;
    age?: string;
    aboutMe?: string;
    height?: string;
    maritalStatus?: string;
    motherTongue?: string;
    physicalStatus?: string;
    appearance?: string;
    weight?: string | number;
    languagesSpoken?: string;
    marriageGoalPlan?: string;
    relocateForPartner?: string;
  };
  mn_religious_info_draft?: {
    religion?: string;
    community?: string;
    religiousness?: string;
    namaz?: string;
    quranReading?: string;
  };
  mn_professional_info_draft?: {
    education?: string;
    customEducation?: string;
    educationalInstitution?: string;
    companyName?: string;
    profession?: string;
    professionType?: string;
    annualIncome?: string;
  };
  mn_family_details_draft?: {
    familyType?: string;
    financialStatus?: string;
    familyValues?: string;
    fatherOccupation?: string;
    motherOccupation?: string;
    siblingsCount?: string;
  };
  mn_interests_draft?: {
    interests?: string[];
    aboutMe?: string;
  };
  mn_habits_draft?: {
    favouriteSports?: string | string[];
    favouritePlaces?: string | string[];
    eatingHabits?: string;
    smokingHabits?: string;
    drinkingHabits?: string;
  };
  mn_partner_preferences_draft?: {
    aboutPartner?: string;
    minAge?: number | string;
    maxAge?: number | string;
    minHeight?: string;
    maxHeight?: string;
    preferredHeight?: string;
    maritalStatus?: string;
    preferredMaritalStatus?: string;
    religion?: string;
    preferredReligion?: string;
    community?: string;
    preferredCommunity?: string;
    education?: string;
    preferredEducation?: string;
    occupation?: string;
    preferredOccupation?: string;
    preferredLocations?: string;
    prefNamaz?: string;
    prefQuranReading?: string;
    explanation?: string;
  };
  mn_profile_photos_draft?: {
    photos?: Photo[];
  };
  mn_voice_intro_draft?: {
    voice?: {
      dataUrl?: string;
    };
  };
}

export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  gender: string;
  dob?: string;
  cast?: string;
  location?: string;
  kyc_status: string;
  kyc_rejected_reason?: string;
  profile_for?: string;
  is_online?: boolean;
  is_new_user?: boolean;
  created_at?: string;
  last_login?: string;
  profile_details?: ProfileDetails;
}

export interface EnrichedProfile {
  id: number;
  name: string;
  photo: string;
  gender: string;
  location: string;
  aboutMe: string;
  profileId: string;
  age: number;
  height: string;
  education: string;
  profession: string;
  religion: string;
  community: string;
  maritalStatus: string;
  profileFor: string;
  motherTongue: string;
  physicalStatus: string;
  appearance: string;
  weight: string;
  languagesSpoken: string;
  presentLocation: string;
  marriageGoalPlan: string;
  relocateForPartner: string;
  religiousness: string;
  namaz: string;
  quranReading: string;
  educationalInstitution: string;
  companyName: string;
  professionType: string;
  annualIncome: string;
  familyType: string;
  financialStatus: string;
  familyValues: string;
  fatherOccupation: string;
  motherOccupation: string;
  siblingsCount: string;
  interestsList: string[];
  personalityDescription: string;
  favouriteSports: string[];
  favouritePlaces: string[];
  eatingHabits: string;
  smokingHabits: string;
  drinkingHabits: string;
  aboutPartner: string;
  prefAge: string;
  prefHeight: string;
  prefMaritalStatus: string;
  prefReligion: string;
  prefCommunity: string;
  prefEducation: string;
  prefOccupation: string;
  prefLocations: string;
  prefNamaz: string;
  prefQuranReading: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  [key: string]: any;
}
