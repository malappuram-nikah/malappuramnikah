import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";
import prisma from "../../../../shared/database/prisma";

export class AcceptInterestUseCase {
  constructor(
    private interestRepository: IInterestRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(interestId: number, requestingUserId: number): Promise<{ message: string }> {
    const interest = await this.interestRepository.findInterestById(interestId);
    if (!interest) {
      throw new NotFoundError("Interest record not found.");
    }

    InteractionValidator.validateOwnership(interest.receiver_id, requestingUserId);

    const isBlocked = await this.blockRepository.isBlockedEither(interest.sender_id, interest.receiver_id);
    InteractionValidator.validateNotBlocked(isBlocked);

    await this.interestRepository.updateInterestStatus(interest.id, "ACCEPTED");

    await prisma.notification.create({
      data: {
        user_id: interest.sender_id,
        sender_id: requestingUserId,
        type: "INTEREST_ACCEPTED",
        title: "Interest Accepted!",
        message: "Your expressed interest was accepted.",
      },
    });

    return { message: "Interest accepted successfully." };
  }
}
