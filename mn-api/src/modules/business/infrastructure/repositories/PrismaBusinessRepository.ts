import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import {
  BusinessProfileEntity,
  BusinessCategoryEntity,
  BusinessMediaEntity,
  BusinessSocialLinkEntity,
  BusinessWorkEntity,
  BusinessOfferEntity,
  BusinessBookingEntity,
  BusinessReviewEntity,
  MonetizationModel,
  BookingStatus,
} from "../../domain/entities/business.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";
import prisma from "../../../../shared/database/prisma";

export class PrismaBusinessRepository implements IBusinessRepository {
  async createProfile(data: {
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
  }): Promise<BusinessProfileEntity> {
    const record = await prisma.businessProfile.create({
      data: {
        user_id: data.user_id,
        category_id: data.category_id,
        business_name: data.business_name,
        description: data.description,
        experience_years: data.experience_years || 0,
        location: data.location,
        phone: data.phone,
        email: data.email,
        website: data.website,
        monetization_model: data.monetization_model || "ONE_TIME",
        status: "ACTIVE",
        verification_status: "UNVERIFIED",
        average_rating: 0.0,
        total_reviews: 0,
        total_completed_bookings: 0,
      },
      include: {
        category: true,
      },
    });
    return record as unknown as BusinessProfileEntity;
  }

  async findProfileByUserId(userId: number): Promise<BusinessProfileEntity | null> {
    const record = await prisma.businessProfile.findUnique({
      where: { user_id: userId },
      include: {
        category: true,
        media: true,
        social_links: true,
        works: { include: { media: true } },
        offers: true,
      },
    });
    return record ? (record as unknown as BusinessProfileEntity) : null;
  }

  async findProfileById(id: number): Promise<BusinessProfileEntity | null> {
    const record = await prisma.businessProfile.findUnique({
      where: { id },
      include: {
        category: true,
        media: true,
        social_links: true,
        works: { include: { media: true } },
        offers: true,
      },
    });
    return record ? (record as unknown as BusinessProfileEntity) : null;
  }

  async updateProfile(id: number, data: Partial<BusinessProfileEntity>): Promise<BusinessProfileEntity> {
    const record = await prisma.businessProfile.update({
      where: { id },
      data: data as any,
      include: { category: true },
    });
    return record as unknown as BusinessProfileEntity;
  }

  async getCategories(): Promise<BusinessCategoryEntity[]> {
    const records = await prisma.businessCategory.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    return records as unknown as BusinessCategoryEntity[];
  }

  async findCategoryById(id: number): Promise<BusinessCategoryEntity | null> {
    const record = await prisma.businessCategory.findUnique({ where: { id } });
    return record as unknown as BusinessCategoryEntity;
  }

  async createCategory(name: string, description?: string): Promise<BusinessCategoryEntity> {
    const record = await prisma.businessCategory.create({
      data: { name, description, is_active: true },
    });
    return record as unknown as BusinessCategoryEntity;
  }

  async addMedia(data: {
    business_id: number;
    url: string;
    media_type?: string;
    is_primary?: boolean;
    sort_order?: number;
  }): Promise<BusinessMediaEntity> {
    const record = await prisma.businessMedia.create({
      data: {
        business_id: data.business_id,
        url: data.url,
        media_type: data.media_type || "PHOTO",
        is_primary: data.is_primary || false,
        sort_order: data.sort_order || 0,
      },
    });
    return record as unknown as BusinessMediaEntity;
  }

  async getBusinessMedia(businessId: number): Promise<BusinessMediaEntity[]> {
    const records = await prisma.businessMedia.findMany({
      where: { business_id: businessId },
      orderBy: { sort_order: "asc" },
    });
    return records as unknown as BusinessMediaEntity[];
  }

  async deleteMedia(mediaId: number): Promise<void> {
    await prisma.businessMedia.delete({ where: { id: mediaId } });
  }

  async addSocialLink(businessId: number, platform: string, url: string): Promise<BusinessSocialLinkEntity> {
    const record = await prisma.businessSocialLink.create({
      data: {
        business_id: businessId,
        platform,
        url,
      },
    });
    return record as unknown as BusinessSocialLinkEntity;
  }

  async deleteSocialLink(linkId: number): Promise<void> {
    await prisma.businessSocialLink.delete({ where: { id: linkId } });
  }

  async createWork(data: {
    business_id: number;
    title: string;
    description?: string;
    category_type?: string;
    work_date?: string;
    media_urls?: string[];
  }): Promise<BusinessWorkEntity> {
    const record = await prisma.businessWork.create({
      data: {
        business_id: data.business_id,
        title: data.title,
        description: data.description,
        category_type: data.category_type,
        work_date: data.work_date,
        is_published: true,
        media: data.media_urls
          ? {
              create: data.media_urls.map((url) => ({ url, media_type: "PHOTO" })),
            }
          : undefined,
      },
      include: { media: true },
    });
    return record as unknown as BusinessWorkEntity;
  }

  async findWorkById(workId: number): Promise<BusinessWorkEntity | null> {
    const record = await prisma.businessWork.findUnique({
      where: { id: workId },
      include: { media: true },
    });
    return record ? (record as unknown as BusinessWorkEntity) : null;
  }

  async updateWork(workId: number, data: Partial<BusinessWorkEntity>): Promise<BusinessWorkEntity> {
    const record = await prisma.businessWork.update({
      where: { id: workId },
      data: data as any,
      include: { media: true },
    });
    return record as unknown as BusinessWorkEntity;
  }

  async deleteWork(workId: number): Promise<void> {
    await prisma.businessWork.delete({ where: { id: workId } });
  }

  async getBusinessWorks(businessId: number): Promise<BusinessWorkEntity[]> {
    const records = await prisma.businessWork.findMany({
      where: { business_id: businessId, is_published: true },
      include: { media: true },
      orderBy: { created_at: "desc" },
    });
    return records as unknown as BusinessWorkEntity[];
  }

  async createOffer(data: {
    business_id: number;
    title: string;
    description?: string;
    price: number;
    discounted_price?: number;
    validity_from: Date;
    validity_to: Date;
  }): Promise<BusinessOfferEntity> {
    const record = await prisma.businessOffer.create({
      data: {
        business_id: data.business_id,
        title: data.title,
        description: data.description,
        price: data.price,
        discounted_price: data.discounted_price,
        validity_from: data.validity_from,
        validity_to: data.validity_to,
        is_active: true,
      },
    });
    return record as unknown as BusinessOfferEntity;
  }

  async findOfferById(offerId: number): Promise<BusinessOfferEntity | null> {
    const record = await prisma.businessOffer.findUnique({ where: { id: offerId } });
    return record ? (record as unknown as BusinessOfferEntity) : null;
  }

  async updateOffer(offerId: number, data: Partial<BusinessOfferEntity>): Promise<BusinessOfferEntity> {
    const record = await prisma.businessOffer.update({
      where: { id: offerId },
      data: data as any,
    });
    return record as unknown as BusinessOfferEntity;
  }

  async deleteOffer(offerId: number): Promise<void> {
    await prisma.businessOffer.delete({ where: { id: offerId } });
  }

  async getActiveOffers(businessId: number): Promise<BusinessOfferEntity[]> {
    const records = await prisma.businessOffer.findMany({
      where: { business_id: businessId, is_active: true },
      orderBy: { created_at: "desc" },
    });
    return records as unknown as BusinessOfferEntity[];
  }

  async createBooking(data: {
    business_id: number;
    customer_id: number;
    booking_date: Date;
    gross_amount: number;
    monetization_model: MonetizationModel;
    commission_rate: number;
    commission_amount: number;
    business_amount: number;
  }): Promise<BusinessBookingEntity> {
    const record = await prisma.businessBooking.create({
      data: {
        business_id: data.business_id,
        customer_id: data.customer_id,
        booking_date: data.booking_date,
        status: "PENDING",
        gross_amount: data.gross_amount,
        monetization_model: data.monetization_model,
        commission_rate: data.commission_rate,
        commission_amount: data.commission_amount,
        business_amount: data.business_amount,
      },
    });
    return record as unknown as BusinessBookingEntity;
  }

  async findBookingById(bookingId: number): Promise<BusinessBookingEntity | null> {
    const record = await prisma.businessBooking.findUnique({
      where: { id: bookingId },
      include: { business: true, review: true },
    });
    return record ? (record as unknown as BusinessBookingEntity) : null;
  }

  async updateBookingStatus(bookingId: number, status: BookingStatus): Promise<BusinessBookingEntity> {
    const record = await prisma.businessBooking.update({
      where: { id: bookingId },
      data: { status },
    });
    return record as unknown as BusinessBookingEntity;
  }

  async getCustomerBookings(customerId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<BusinessBookingEntity>> {
    const skip = (page - 1) * limit;
    const where = { customer_id: customerId };

    const [total, records] = await Promise.all([
      prisma.businessBooking.count({ where }),
      prisma.businessBooking.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: { business: true, review: true },
      }),
    ]);

    return {
      data: records as unknown as BusinessBookingEntity[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getBusinessBookings(businessId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<BusinessBookingEntity>> {
    const skip = (page - 1) * limit;
    const where = { business_id: businessId };

    const [total, records] = await Promise.all([
      prisma.businessBooking.count({ where }),
      prisma.businessBooking.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: { review: true },
      }),
    ]);

    return {
      data: records as unknown as BusinessBookingEntity[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createReview(data: {
    business_id: number;
    user_id: number;
    booking_id: number;
    rating: number;
    subject?: string;
    comment?: string;
  }): Promise<BusinessReviewEntity> {
    const record = await prisma.businessReview.create({
      data: {
        business_id: data.business_id,
        user_id: data.user_id,
        booking_id: data.booking_id,
        rating: data.rating,
        subject: data.subject,
        comment: data.comment,
        status: "APPROVED",
      },
    });
    return record as unknown as BusinessReviewEntity;
  }

  async findReviewByBookingId(bookingId: number): Promise<BusinessReviewEntity | null> {
    const record = await prisma.businessReview.findUnique({ where: { booking_id: bookingId } });
    return record ? (record as unknown as BusinessReviewEntity) : null;
  }

  async getBusinessReviews(businessId: number): Promise<BusinessReviewEntity[]> {
    const records = await prisma.businessReview.findMany({
      where: { business_id: businessId, status: "APPROVED" },
      orderBy: { created_at: "desc" },
    });
    return records as unknown as BusinessReviewEntity[];
  }

  async getCategoryProfiles(categoryId: number): Promise<BusinessProfileEntity[]> {
    const records = await prisma.businessProfile.findMany({
      where: { category_id: categoryId, status: "ACTIVE" },
    });
    return records as unknown as BusinessProfileEntity[];
  }

  async updateBusinessStats(
    businessId: number,
    averageRating: number,
    totalReviews: number,
    totalCompletedBookings: number
  ): Promise<void> {
    await prisma.businessProfile.update({
      where: { id: businessId },
      data: {
        average_rating: averageRating,
        total_reviews: totalReviews,
        total_completed_bookings: totalCompletedBookings,
      },
    });
  }
}
