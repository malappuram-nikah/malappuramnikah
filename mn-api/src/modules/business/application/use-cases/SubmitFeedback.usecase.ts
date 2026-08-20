import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export class SubmitFeedbackUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(userId: number, category: string, rating: any, subject: string, message: string): Promise<any> {
    const validCategories = ["SUGGESTION", "BUG", "APPRECIATION", "OTHER"];
    const normalizedCategory = typeof category === "string" ? category.toUpperCase().trim() : "";

    if (!validCategories.includes(normalizedCategory)) {
      throw new BadRequestError("Invalid category. Must be one of SUGGESTION, BUG, APPRECIATION, or OTHER.");
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new BadRequestError("Invalid rating. Rating must be a whole number between 1 and 5.");
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      throw new BadRequestError("Invalid subject. Subject must be at least 3 characters long.");
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      throw new BadRequestError("Invalid message. Message must be at least 10 characters long.");
    }

    return await this.businessRepository.createFeedback(
      userId,
      normalizedCategory,
      parsedRating,
      subject.trim(),
      message.trim()
    );
  }
}
