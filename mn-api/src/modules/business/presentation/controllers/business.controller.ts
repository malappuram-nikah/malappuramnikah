import { Request, Response, NextFunction } from "express";
import { CreateBusinessProfileUseCase } from "../../application/use-cases/CreateBusinessProfile.usecase";
import { UpdateBusinessProfileUseCase } from "../../application/use-cases/UpdateBusinessProfile.usecase";
import { ManageBusinessCategoryUseCase } from "../../application/use-cases/ManageBusinessCategory.usecase";
import { ManageBusinessMediaUseCase } from "../../application/use-cases/ManageBusinessMedia.usecase";
import { ManageBusinessWorkUseCase } from "../../application/use-cases/ManageBusinessWork.usecase";
import { ManageBusinessOfferUseCase } from "../../application/use-cases/ManageBusinessOffer.usecase";
import { CreateBookingUseCase } from "../../application/use-cases/CreateBooking.usecase";
import { UpdateBookingStatusUseCase } from "../../application/use-cases/UpdateBookingStatus.usecase";
import { SubmitBusinessReviewUseCase } from "../../application/use-cases/SubmitBusinessReview.usecase";
import { GetCategoryLeaderboardUseCase } from "../../application/use-cases/GetCategoryLeaderboard.usecase";
import { GetPublicBusinessProfileUseCase } from "../../application/use-cases/GetPublicBusinessProfile.usecase";

import { PrismaBusinessRepository } from "../../infrastructure/repositories/PrismaBusinessRepository";
import { sendSuccess } from "../../../../shared/utils/response.util";
import { BadRequestError } from "../../../../shared/errors/AppError";

const repo = new PrismaBusinessRepository();

const createProfileUseCase = new CreateBusinessProfileUseCase(repo);
const updateProfileUseCase = new UpdateBusinessProfileUseCase(repo);
const categoryUseCase = new ManageBusinessCategoryUseCase(repo);
const mediaUseCase = new ManageBusinessMediaUseCase(repo);
const workUseCase = new ManageBusinessWorkUseCase(repo);
const offerUseCase = new ManageBusinessOfferUseCase(repo);
const createBookingUseCase = new CreateBookingUseCase(repo);
const updateBookingStatusUseCase = new UpdateBookingStatusUseCase(repo);
const submitReviewUseCase = new SubmitBusinessReviewUseCase(repo);
const leaderboardUseCase = new GetCategoryLeaderboardUseCase(repo);
const getPublicProfileUseCase = new GetPublicBusinessProfileUseCase(repo);

export class BusinessController {
  // Profiles
  static async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { categoryId, businessName, description, experienceYears, location, phone, email, website, monetizationModel } = req.body;

      if (!categoryId || !businessName || !location) {
        throw new BadRequestError("categoryId, businessName, and location are required.");
      }

      const profile = await createProfileUseCase.execute({
        userId,
        categoryId: parseInt(categoryId, 10),
        businessName,
        description,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
        location,
        phone,
        email,
        website,
        monetizationModel,
      });

      sendSuccess(res, profile, "Business profile created successfully.", 201);
    } catch (err) {
      next(err);
    }
  }

  static async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const profile = await repo.findProfileByUserId(userId);
      if (!profile) {
        throw new BadRequestError("No business profile found for this user.");
      }
      sendSuccess(res, profile, "Business profile retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const profile = await getPublicProfileUseCase.execute(id);
      sendSuccess(res, profile, "Public business profile retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const id = parseInt(req.params.id, 10);
      const updated = await updateProfileUseCase.execute(userId, id, req.body);
      sendSuccess(res, updated, "Business profile updated.", 200);
    } catch (err) {
      next(err);
    }
  }

  // Categories
  static async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryUseCase.listCategories();
      sendSuccess(res, categories, "Business categories retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      if (!name) {
        throw new BadRequestError("Category name is required.");
      }
      const category = await categoryUseCase.createCategory(name, description);
      sendSuccess(res, category, "Business category created.", 201);
    } catch (err) {
      next(err);
    }
  }

  // Media
  static async addMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { businessId, url, mediaType, isPrimary } = req.body;

      if (!businessId || !url) {
        throw new BadRequestError("businessId and url are required.");
      }

      const media = await mediaUseCase.addMedia(userId, parseInt(businessId, 10), url, mediaType, isPrimary);
      sendSuccess(res, media, "Media added to business profile.", 201);
    } catch (err) {
      next(err);
    }
  }

  // Portfolio Works
  static async createWork(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { businessId, title, description, categoryType, workDate, mediaUrls } = req.body;

      if (!businessId || !title) {
        throw new BadRequestError("businessId and title are required.");
      }

      const work = await workUseCase.createWork(
        userId,
        parseInt(businessId, 10),
        title,
        description,
        categoryType,
        workDate,
        mediaUrls
      );
      sendSuccess(res, work, "Portfolio work created.", 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteWork(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const workId = parseInt(req.params.id, 10);
      await workUseCase.deleteWork(userId, workId);
      sendSuccess(res, null, "Portfolio work deleted.", 200);
    } catch (err) {
      next(err);
    }
  }

  // Offers
  static async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { businessId, title, description, price, discountedPrice, validityFrom, validityTo } = req.body;

      if (!businessId || !title || price === undefined || !validityFrom || !validityTo) {
        throw new BadRequestError("businessId, title, price, validityFrom, and validityTo are required.");
      }

      const offer = await offerUseCase.createOffer(
        userId,
        parseInt(businessId, 10),
        title,
        parseFloat(price),
        new Date(validityFrom),
        new Date(validityTo),
        description,
        discountedPrice ? parseFloat(discountedPrice) : undefined
      );

      sendSuccess(res, offer, "Offer created successfully.", 201);
    } catch (err) {
      next(err);
    }
  }

  static async getActiveOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = parseInt(req.params.businessId, 10);
      const offers = await offerUseCase.getActiveOffers(businessId);
      sendSuccess(res, offers, "Active offers retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }

  // Bookings
  static async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user?.userId;
      const { businessId, bookingDate, grossAmount } = req.body;

      if (!businessId || !bookingDate || grossAmount === undefined) {
        throw new BadRequestError("businessId, bookingDate, and grossAmount are required.");
      }

      const booking = await createBookingUseCase.execute({
        customerId,
        businessId: parseInt(businessId, 10),
        bookingDate: new Date(bookingDate),
        grossAmount: parseFloat(grossAmount),
      });

      sendSuccess(res, booking, "Booking request created successfully.", 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateBookingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const bookingId = parseInt(req.params.id, 10);
      const { status } = req.body;

      if (!status) {
        throw new BadRequestError("Target status is required.");
      }

      const updated = await updateBookingStatusUseCase.execute(userId, bookingId, status);
      sendSuccess(res, updated, `Booking status updated to ${status}.`, 200);
    } catch (err) {
      next(err);
    }
  }

  // Reviews
  static async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { businessId, bookingId, rating, subject, comment } = req.body;

      if (!businessId || !bookingId || rating === undefined) {
        throw new BadRequestError("businessId, bookingId, and rating are required.");
      }

      const review = await submitReviewUseCase.execute({
        userId,
        businessId: parseInt(businessId, 10),
        bookingId: parseInt(bookingId, 10),
        rating: parseInt(rating, 10),
        subject,
        comment,
      });

      sendSuccess(res, review, "Review submitted successfully.", 201);
    } catch (err) {
      next(err);
    }
  }

  // Leaderboard
  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parseInt(req.params.categoryId, 10);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const leaderboard = await leaderboardUseCase.execute(categoryId, page, limit);
      sendSuccess(res, leaderboard, "Category leaderboard retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }
}
