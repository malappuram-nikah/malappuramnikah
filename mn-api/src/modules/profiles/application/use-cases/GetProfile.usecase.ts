import { IProfileRepository, FullProfileResult } from "../../domain/repositories/IProfileRepository";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class GetProfileUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(userId: number): Promise<FullProfileResult> {
    const profile = await this.profileRepository.getFullProfile(userId);
    if (!profile) {
      throw new NotFoundError("Profile not found.");
    }
    return profile;
  }
}
