import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class UnblockUserUseCase {
  constructor(private blockRepository: IBlockRepository) {}

  async execute(blockerId: number, blockedId: number): Promise<{ message: string }> {
    InteractionValidator.validateSelfInteraction(blockerId, blockedId, "unblock");

    const existingBlock = await this.blockRepository.findBlock(blockerId, blockedId);
    if (!existingBlock) {
      throw new NotFoundError("Block record not found.");
    }

    await this.blockRepository.unblockUser(blockerId, blockedId);

    return { message: "User unblocked successfully." };
  }
}
