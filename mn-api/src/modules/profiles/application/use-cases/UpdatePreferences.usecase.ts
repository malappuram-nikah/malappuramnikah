import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UpdatePreferencesDto {
  userId: number;
  age_min?: number;
  age_max?: number;
  height_min?: number;
  height_max?: number;
  marital_status_list?: any;
  district_list?: any;
  education_list?: any;
  profession_list?: any;
  community_list?: any;
}

export class UpdatePreferencesUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(dto: UpdatePreferencesDto): Promise<{ message: string }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    await this.profileRepository.updatePreferences(dto.userId, dto);
    return { message: "Partner preferences updated successfully." };
  }
}
