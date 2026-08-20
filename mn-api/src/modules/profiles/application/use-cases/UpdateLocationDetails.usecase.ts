import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UpdateLocationDetailsDto {
  userId: number;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  native_place?: string;
}

export class UpdateLocationDetailsUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(dto: UpdateLocationDetailsDto): Promise<{ message: string }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    await this.profileRepository.updateLocationDetails(dto.userId, dto);
    return { message: "Location details updated successfully." };
  }
}
