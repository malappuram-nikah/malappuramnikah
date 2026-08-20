export type BusinessStatusType = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type BookingStatusType = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface BusinessEntity {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  location: string;
  contact_phone: string;
  contact_email?: string | null;
  status: BusinessStatusType;
  commission_rate: number;
  rating: number;
  revenue: number;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessOwnerEntity {
  id: number;
  user_id: number;
  business_id: number;
  role: string;
  created_at: Date;
}

export interface BusinessTeamMemberEntity {
  id: number;
  business_id: number;
  name: string;
  role: string;
  mobile_number: string;
  email?: string | null;
  created_at: Date;
}

export interface BusinessServiceEntity {
  id: number;
  business_id: number;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  duration_minutes?: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface BusinessMediaEntity {
  id: number;
  business_id: number;
  url: string;
  media_type: string;
  is_primary: boolean;
  created_at: Date;
}

export interface BusinessAvailabilityEntity {
  id: number;
  business_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface BusinessBlockedDateEntity {
  id: number;
  business_id: number;
  blocked_date: Date;
  reason?: string | null;
}

export interface BusinessSubscriptionEntity {
  id: number;
  business_id: number;
  plan_name: string;
  status: string;
  starts_at: Date;
  expires_at: Date;
}

export interface BusinessBookingEntity {
  id: number;
  business_id: number;
  customer_id: number;
  booking_date: Date;
  status: BookingStatusType;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessBookingItemEntity {
  id: number;
  booking_id: number;
  service_id: number;
  quantity: number;
  price: number;
}

export interface BusinessPaymentEntity {
  id: number;
  booking_id: number;
  amount: number;
  payment_status: string;
  payment_method?: string | null;
  transaction_reference?: string | null;
  created_at: Date;
}

export interface BusinessCommissionEntity {
  id: number;
  business_id: number;
  booking_id: number;
  commission_amount: number;
  payout_status: string;
  created_at: Date;
}

export interface BusinessReviewEntity {
  id: number;
  business_id: number;
  user_id: number;
  rating: number;
  comment?: string | null;
  created_at: Date;
}

export interface BusinessRankingEntity {
  id: number;
  business_id: number;
  score: number;
  rank_category?: string | null;
  updated_at: Date;
}

export interface BusinessRankingConfigEntity {
  id: number;
  weights: any;
  updated_at: Date;
}
