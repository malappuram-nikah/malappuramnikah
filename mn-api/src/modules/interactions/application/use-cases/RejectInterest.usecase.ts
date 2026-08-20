import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import { NotFoundError } from "../../../../shared/errors/AppError";

export class RejectInterestUseCase {
  constructor(private interestRepository: IInterestRepository) {}

  async execute(interestId: number, requestingUserId: number): Promise<{ message: string }> {
    const interest = await this.interestRepository.findInterestById(interestId);
    if (!interest) {
      throw new NotFoundError("Interest record not found.");
    }

    InteractionValidator.validateOwnership(interest.receiver_id, requestingUserId);

    await this.interestRepository.updateInterestStatus(interest.id, "REJECTED");

    return { message: "Interest rejected." };
  }
}
