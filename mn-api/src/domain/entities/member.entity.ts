export interface MemberProfileEntity {
  id: number;
  user_id: number;
  profile_for: string;
  gender: string;
  first_name: string;
  last_name: string;
  dob: string;
  marital_status?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  mother_tongue?: string | null;
  about_me?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MemberPreferenceEntity {
  id: number;
  user_id: number;
  age_min?: number | null;
  age_max?: number | null;
  height_min?: number | null;
  height_max?: number | null;
  marital_status_list?: any;
  district_list?: any;
  education_list?: any;
  profession_list?: any;
  community_list?: any;
  created_at: Date;
  updated_at: Date;
}

export interface MemberEducationEntity {
  id: number;
  user_id: number;
  highest_education: string;
  degree?: string | null;
  institution?: string | null;
  education_field?: string | null;
  created_at: Date;
}

export interface MemberOccupationEntity {
  id: number;
  user_id: number;
  occupation_type?: string | null;
  profession?: string | null;
  company_name?: string | null;
  annual_income?: string | null;
  currency?: string | null;
  created_at: Date;
}

export interface MemberFamilyEntity {
  id: number;
  user_id: number;
  family_status?: string | null;
  financial_status?: string | null;
  family_type?: string | null;
  father_name?: string | null;
  father_occupation?: string | null;
  mother_name?: string | null;
  mother_occupation?: string | null;
  siblings_count?: number | null;
  created_at: Date;
}

export interface MemberLocationEntity {
  id: number;
  user_id: number;
  country: string;
  state: string;
  district?: string | null;
  city?: string | null;
  pincode?: string | null;
  native_place?: string | null;
  created_at: Date;
}

export interface MemberPrivacyEntity {
  id: number;
  user_id: number;
  phone_privacy: string;
  photo_privacy: string;
  biodata_download_allowed: boolean;
  created_at: Date;
}

export interface MemberMediaEntity {
  id: number;
  user_id: number;
  media_type: string;
  url: string;
  is_primary: boolean;
  is_approved: boolean;
  created_at: Date;
}
