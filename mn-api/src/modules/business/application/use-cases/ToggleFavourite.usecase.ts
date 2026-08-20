import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export class ToggleFavouriteUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(favouriterId: number, targetId: number): Promise<string> {
    if (isNaN(targetId) || targetId === favouriterId) {
      throw new BadRequestError("Invalid target_id");
    }
    return await this.businessRepository.toggleFavourite(favouriterId, targetId);
  }
}
