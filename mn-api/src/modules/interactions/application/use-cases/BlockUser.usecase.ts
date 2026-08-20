import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import prisma from "../../../../shared/database/prisma";

export class BlockUserUseCase {
  constructor(private blockRepository: IBlockRepository) {}

  async execute(blockerId: number, blockedId: number): Promise<{ message: string }> {
    InteractionValidator.validateSelfInteraction(blockerId, blockedId, "block");

    const targetUser = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true, status: true },
    });
    InteractionValidator.validateUserStatus(targetUser);

    const existingBlock = await this.blockRepository.findBlock(blockerId, blockedId);
    if (existingBlock) {
      return { message: "User is already blocked." };
    }

    await this.blockRepository.blockUser(blockerId, blockedId);

    // Remove mutual pending interests and favourites
    await prisma.interest.deleteMany({
      where: {
        OR: [
          { sender_id: blockerId, receiver_id: blockedId },
          { sender_id: blockedId, receiver_id: blockerId },
        ],
      },
    });

    await prisma.favourite.deleteMany({
      where: {
        OR: [
          { favouriter_id: blockerId, favourited_id: blockedId },
          { favouriter_id: blockedId, favourited_id: blockerId },
        ],
      },
    });

    return { message: "User blocked successfully." };
  }
}
