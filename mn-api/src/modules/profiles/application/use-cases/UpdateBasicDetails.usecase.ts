import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UpdateBasicDetailsDto {
  userId: number;
  first_name?: string;
  last_name?: string;
  dob?: string;
  marital_status?: string;
  height_cm?: number;
  weight_kg?: number;
  mother_tongue?: string;
  about_me?: string;
}

export class UpdateBasicDetailsUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(dto: UpdateBasicDetailsDto): Promise<{ message: string }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    await this.profileRepository.updateBasicDetails(dto.userId, dto);
    return { message: "Basic profile details updated successfully." };
  }
}
