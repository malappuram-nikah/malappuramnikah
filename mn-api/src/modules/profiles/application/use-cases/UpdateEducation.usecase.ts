import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export interface UpdateEducationDto {
  userId: number;
  highest_education: string;
  degree?: string;
  institution?: string;
  education_field?: string;
}

export class UpdateEducationUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(dto: UpdateEducationDto): Promise<{ message: string }> {
    if (!dto.userId) {
      throw new BadRequestError("User ID is required.");
    }
    if (!dto.highest_education) {
      throw new BadRequestError("Highest education is required.");
    }
    await this.profileRepository.updateEducationDetails(dto.userId, dto);
    return { message: "Education details updated successfully." };
  }
}
