export interface User {
  id?: number;
  profile_for: string;
  gender: string;
  first_name: string;
  last_name: string;
  cast: string;
  location: string;
  mobile_number: string;
  password: string;
  dob: string;
  status: string;
  is_premium: boolean;
  is_new_user: boolean;
  last_login?: Date | null;
  profile_details?: any;
}
