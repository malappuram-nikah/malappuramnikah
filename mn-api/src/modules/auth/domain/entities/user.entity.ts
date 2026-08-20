export interface UserEntity {
  id: number;
  uuid?: string | null;
  profile_for: string;
  gender: string;
  first_name: string;
  last_name: string;
  cast: string;
  location: string;
  email?: string | null;
  mobile_number: string;
  password?: string;
  dob: string;
  status: string;
  is_premium: boolean;
  is_new_user: boolean;
  last_login?: Date | null;
  profile_details?: any;
  search_preferences?: any;
  kyc_status: string;
  referral_code?: string | null;
  referral_points: number;
  created_at: Date;
  updated_at: Date;
}
