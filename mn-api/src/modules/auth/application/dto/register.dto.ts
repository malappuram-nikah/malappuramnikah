export interface RegisterUserDto {
  profile_for: string;
  gender: string;
  first_name: string;
  last_name: string;
  cast: string;
  location: string;
  email?: string;
  mobile_number: string;
  password: string;
  dob: string;
  referralCode?: string;
}
