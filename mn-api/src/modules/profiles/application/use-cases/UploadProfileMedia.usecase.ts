import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { IStorageRepository } from "../../../../shared/storage/IStorageRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UploadProfileMediaDto {
  userId: number;
  fileData: string; // Base64 data string
  media_type?: string;
  is_primary?: boolean;
}

export class UploadProfileMediaUseCase {
  constructor(
    private profileRepository: IProfileRepository,
    private storageRepository: IStorageRepository
  ) {}

  async execute(dto: UploadProfileMediaDto): Promise<{ message: string; media: any }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    if (!dto.fileData) {
      throw new BadRequestError("Media file data is required.");
    }

    const uploadRes = await this.storageRepository.uploadFile(dto.fileData, "photos");
    const media = await this.profileRepository.addProfileMedia(dto.userId, {
      url: uploadRes.url,
      media_type: dto.media_type || "PHOTO",
      is_primary: dto.is_primary ?? false,
    });

    return { message: "Profile media uploaded successfully.", media };
  }
}
