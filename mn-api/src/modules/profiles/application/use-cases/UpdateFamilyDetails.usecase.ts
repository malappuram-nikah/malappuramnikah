import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UpdateFamilyDetailsDto {
  userId: number;
  family_status?: string;
  financial_status?: string;
  family_type?: string;
  father_name?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_occupation?: string;
  siblings_count?: number;
}

export class UpdateFamilyDetailsUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(dto: UpdateFamilyDetailsDto): Promise<{ message: string }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    await this.profileRepository.updateFamilyDetails(dto.userId, dto);
    return { message: "Family details updated successfully." };
  }
}
