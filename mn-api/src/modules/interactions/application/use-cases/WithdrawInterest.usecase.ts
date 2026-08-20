import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";
import prisma from "../../../../shared/database/prisma";

export class WithdrawInterestUseCase {
  constructor(private interestRepository: IInterestRepository) {}

  async execute(interestId: number, requestingUserId: number): Promise<{ message: string }> {
    const interest = await this.interestRepository.findInterestById(interestId);
    if (!interest) {
      throw new NotFoundError("Interest record not found.");
    }

    InteractionValidator.validateOwnership(interest.sender_id, requestingUserId);

    await this.interestRepository.deleteInterest(interest.id);
    await prisma.notification.deleteMany({
      where: { user_id: interest.receiver_id, sender_id: requestingUserId, type: "INTEREST_SENT" },
    });

    return { message: "Interest withdrawn successfully." };
  }
}
