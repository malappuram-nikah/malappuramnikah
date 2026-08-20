import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UpdateOccupationDto {
  userId: number;
  occupation_type?: string;
  profession?: string;
  company_name?: string;
  annual_income?: string;
  currency?: string;
}

export class UpdateOccupationUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(dto: UpdateOccupationDto): Promise<{ message: string }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    await this.profileRepository.updateOccupationDetails(dto.userId, dto);
    return { message: "Occupation details updated successfully." };
  }
}
