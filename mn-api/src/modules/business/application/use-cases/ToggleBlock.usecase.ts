import { IBusinessRepository } from "../../domain/repositories/IBusinessRepository";
import { BadRequestError } from "../../../../shared/errors/AppError";

export class ToggleBlockUseCase {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(blockerId: number, targetId: number): Promise<string> {
    if (isNaN(targetId) || targetId === blockerId) {
      throw new BadRequestError("Invalid target_id");
    }
    return await this.businessRepository.toggleBlock(blockerId, targetId);
  }
}
