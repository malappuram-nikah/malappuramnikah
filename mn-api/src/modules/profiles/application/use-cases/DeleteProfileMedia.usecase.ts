import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError, NotFoundError } from "../../../../shared/errors/AppError";

export class DeleteProfileMediaUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(userId: number, mediaId: number): Promise<{ message: string }> {
    if (!userId || !mediaId) {
      throw new BadRequestError("User ID and Media ID are required.");
    }
    const success = await this.profileRepository.deleteProfileMedia(userId, mediaId);
    if (!success) {
      throw new NotFoundError("Media item not found or unauthorized.");
    }
    return { message: "Profile media deleted successfully." };
  }
}
