import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UpdatePrivacySettingsDto {
  userId: number;
  phone_privacy?: string;
  photo_privacy?: string;
  biodata_download_allowed?: boolean;
}

export class UpdatePrivacySettingsUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(dto: UpdatePrivacySettingsDto): Promise<{ message: string }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    await this.profileRepository.updatePrivacySettings(dto.userId, dto);
    return { message: "Privacy settings updated successfully." };
  }
}
