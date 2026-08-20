export type MonetizationModel = "ONE_TIME" | "COMMISSION";
export type BusinessStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
export type VerificationStatus = "UNVERIFIED" | "VERIFIED" | "REJECTED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export interface BusinessCategoryEntity {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface BusinessProfileEntity {
  id: number;
  user_id: number;
  category_id: number;
  business_name: string;
  description?: string | null;
  experience_years?: number | null;
  location: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  monetization_model: MonetizationModel;
  status: BusinessStatus;
  verification_status: VerificationStatus;
  average_rating: number;
  total_reviews: number;
  total_completed_bookings: number;
  created_at: Date;
  updated_at: Date;

  category?: BusinessCategoryEntity;
  media?: BusinessMediaEntity[];
  social_links?: BusinessSocialLinkEntity[];
  works?: BusinessWorkEntity[];
  offers?: BusinessOfferEntity[];
  reviews?: BusinessReviewEntity[];
}

export interface BusinessMediaEntity {
  id: number;
  business_id: number;
  media_type: string;
  storage_key?: string | null;
  url: string;
  sort_order: number;
  is_primary: boolean;
  metadata?: any;
  created_at: Date;
}

export interface BusinessSocialLinkEntity {
  id: number;
  business_id: number;
  platform: string;
  url: string;
  created_at: Date;
}

export interface BusinessWorkEntity {
  id: number;
  business_id: number;
  title: string;
  description?: string | null;
  category_type?: string | null;
  work_date?: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;

  media?: BusinessWorkMediaEntity[];
}

export interface BusinessWorkMediaEntity {
  id: number;
  work_id: number;
  media_type: string;
  url: string;
  created_at: Date;
}

export interface BusinessOfferEntity {
  id: number;
  business_id: number;
  title: string;
  description?: string | null;
  price: number;
  discounted_price?: number | null;
  validity_from: Date;
  validity_to: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessBookingEntity {
  id: number;
  business_id: number;
  customer_id: number;
  booking_date: Date;
  status: BookingStatus;
  gross_amount: number;
  monetization_model: MonetizationModel;
  commission_rate: number;
  commission_amount: number;
  business_amount: number;
  created_at: Date;
  updated_at: Date;

  business?: BusinessProfileEntity;
  payments?: BusinessPaymentEntity[];
  review?: BusinessReviewEntity | null;
}

export interface BusinessPaymentEntity {
  id: number;
  booking_id: number;
  amount: number;
  status: string;
  payment_method?: string | null;
  transaction_reference?: string | null;
  created_at: Date;
}

export interface BusinessReviewEntity {
  id: number;
  business_id: number;
  user_id: number;
  booking_id: number;
  rating: number;
  subject?: string | null;
  comment?: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessRankingEntity {
  id: number;
  business_id: number;
  category_id: number;
  score: number;
  updated_at: Date;

  business?: BusinessProfileEntity;
}
