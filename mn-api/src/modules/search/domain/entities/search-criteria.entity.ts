export interface SearchCriteria {
  gender?: string;
  minAge?: number;
  maxAge?: number;
  minHeightCm?: number;
  maxHeightCm?: number;
  maritalStatus?: string;
  district?: string;
  state?: string;
  country?: string;
  highestEducation?: string;
  profession?: string;
  motherTongue?: string;
  sortBy?: "created_at" | "age" | "height";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface SearchResultItem {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  age: number;
  marital_status?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  mother_tongue?: string | null;
  about_me?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  highest_education?: string | null;
  profession?: string | null;
  photo_url?: string | null;
  created_at: Date;
}
