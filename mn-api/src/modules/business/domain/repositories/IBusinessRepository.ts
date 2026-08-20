import {
  BusinessProfileEntity,
  BusinessCategoryEntity,
  BusinessMediaEntity,
  BusinessSocialLinkEntity,
  BusinessWorkEntity,
  BusinessOfferEntity,
  BusinessBookingEntity,
  BusinessPaymentEntity,
  BusinessReviewEntity,
  BusinessRankingEntity,
  MonetizationModel,
  BookingStatus,
} from "../entities/business.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export interface IBusinessRepository {
  // Profile
  createProfile(data: {
    user_id: number;
    category_id: number;
    business_name: string;
    description?: string;
    experience_years?: number;
    location: string;
    phone?: string;
    email?: string;
    website?: string;
    monetization_model?: MonetizationModel;
  }): Promise<BusinessProfileEntity>;

  findProfileByUserId(userId: number): Promise<BusinessProfileEntity | null>;
  findProfileById(id: number): Promise<BusinessProfileEntity | null>;
  updateProfile(id: number, data: Partial<BusinessProfileEntity>): Promise<BusinessProfileEntity>;

  // Categories
  getCategories(): Promise<BusinessCategoryEntity[]>;
  findCategoryById(id: number): Promise<BusinessCategoryEntity | null>;
  createCategory(name: string, description?: string): Promise<BusinessCategoryEntity>;

  // Media
  addMedia(data: {
    business_id: number;
    url: string;
    media_type?: string;
    is_primary?: boolean;
    sort_order?: number;
  }): Promise<BusinessMediaEntity>;
  getBusinessMedia(businessId: number): Promise<BusinessMediaEntity[]>;
  deleteMedia(mediaId: number): Promise<void>;

  // Social Links
  addSocialLink(businessId: number, platform: string, url: string): Promise<BusinessSocialLinkEntity>;
  deleteSocialLink(linkId: number): Promise<void>;

  // Portfolio Work
  createWork(data: {
    business_id: number;
    title: string;
    description?: string;
    category_type?: string;
    work_date?: string;
    media_urls?: string[];
  }): Promise<BusinessWorkEntity>;
  findWorkById(workId: number): Promise<BusinessWorkEntity | null>;
  updateWork(workId: number, data: Partial<BusinessWorkEntity>): Promise<BusinessWorkEntity>;
  deleteWork(workId: number): Promise<void>;
  getBusinessWorks(businessId: number): Promise<BusinessWorkEntity[]>;

  // Offers
  createOffer(data: {
    business_id: number;
    title: string;
    description?: string;
    price: number;
    discounted_price?: number;
    validity_from: Date;
    validity_to: Date;
  }): Promise<BusinessOfferEntity>;
  findOfferById(offerId: number): Promise<BusinessOfferEntity | null>;
  updateOffer(offerId: number, data: Partial<BusinessOfferEntity>): Promise<BusinessOfferEntity>;
  deleteOffer(offerId: number): Promise<void>;
  getActiveOffers(businessId: number): Promise<BusinessOfferEntity[]>;

  // Bookings
  createBooking(data: {
    business_id: number;
    customer_id: number;
    booking_date: Date;
    gross_amount: number;
    monetization_model: MonetizationModel;
    commission_rate: number;
    commission_amount: number;
    business_amount: number;
  }): Promise<BusinessBookingEntity>;
  findBookingById(bookingId: number): Promise<BusinessBookingEntity | null>;
  updateBookingStatus(bookingId: number, status: BookingStatus): Promise<BusinessBookingEntity>;
  getCustomerBookings(customerId: number, page?: number, limit?: number): Promise<PaginatedResult<BusinessBookingEntity>>;
  getBusinessBookings(businessId: number, page?: number, limit?: number): Promise<PaginatedResult<BusinessBookingEntity>>;

  // Reviews
  createReview(data: {
    business_id: number;
    user_id: number;
    booking_id: number;
    rating: number;
    subject?: string;
    comment?: string;
  }): Promise<BusinessReviewEntity>;
  findReviewByBookingId(bookingId: number): Promise<BusinessReviewEntity | null>;
  getBusinessReviews(businessId: number): Promise<BusinessReviewEntity[]>;

  // Leaderboard & Rankings
  getCategoryProfiles(categoryId: number): Promise<BusinessProfileEntity[]>;
  updateBusinessStats(businessId: number, averageRating: number, totalReviews: number, totalCompletedBookings: number): Promise<void>;
}
