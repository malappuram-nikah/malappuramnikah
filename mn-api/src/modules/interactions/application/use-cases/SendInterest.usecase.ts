import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import { ConflictError } from "../../../../shared/errors/AppError";
import prisma from "../../../../shared/database/prisma";

export interface SendInterestDto {
  senderId: number;
  receiverId: number;
}

export class SendInterestUseCase {
  constructor(
    private interestRepository: IInterestRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(dto: SendInterestDto): Promise<{ message: string; interestId: number; status: string }> {
    InteractionValidator.validateSelfInteraction(dto.senderId, dto.receiverId, "send interest to");

    const receiver = await prisma.user.findUnique({
      where: { id: dto.receiverId },
      select: { id: true, status: true },
    });
    InteractionValidator.validateUserStatus(receiver);

    const isBlocked = await this.blockRepository.isBlockedEither(dto.senderId, dto.receiverId);
    InteractionValidator.validateNotBlocked(isBlocked);

    const existingInterest = await this.interestRepository.findInterest(dto.senderId, dto.receiverId);
    if (existingInterest) {
      if (existingInterest.status === "PENDING") {
        await this.interestRepository.deleteInterest(existingInterest.id);
        await prisma.notification.deleteMany({
          where: { user_id: dto.receiverId, sender_id: dto.senderId, type: "INTEREST_SENT" },
        });
        return { message: "Interest withdrawn successfully.", interestId: existingInterest.id, status: "WITHDRAWN" };
      }
      throw new ConflictError(`An interest already exists with status ${existingInterest.status}`);
    }

    const reverseInterest = await this.interestRepository.findInterest(dto.receiverId, dto.senderId);
    if (reverseInterest && reverseInterest.status === "PENDING") {
      const newInterest = await this.interestRepository.createInterest(dto.senderId, dto.receiverId);
      await this.interestRepository.updateInterestStatus(newInterest.id, "ACCEPTED");
      await this.interestRepository.updateInterestStatus(reverseInterest.id, "ACCEPTED");

      await prisma.notification.create({
        data: {
          user_id: dto.senderId,
          sender_id: dto.receiverId,
          type: "MUTUAL_MATCH",
          title: "It's a Match! 🎉",
          message: "You both expressed interest in each other!",
        },
      });
      await prisma.notification.create({
        data: {
          user_id: dto.receiverId,
          sender_id: dto.senderId,
          type: "MUTUAL_MATCH",
          title: "It's a Match! 🎉",
          message: "You both expressed interest in each other!",
        },
      });

      return { message: "Mutual match established!", interestId: newInterest.id, status: "ACCEPTED" };
    }

    const interest = await this.interestRepository.createInterest(dto.senderId, dto.receiverId);

    const senderProfile = await prisma.memberProfile.findUnique({
      where: { user_id: dto.senderId },
      select: { first_name: true, last_name: true },
    });
    const senderName = senderProfile?.first_name ? `${senderProfile.first_name} ${senderProfile.last_name || ""}`.trim() : `User #${dto.senderId}`;

    await prisma.notification.create({
      data: {
        user_id: dto.receiverId,
        sender_id: dto.senderId,
        type: "INTEREST_SENT",
        title: "New Interest Received",
        message: `${senderName} expressed interest in your profile.`,
      },
    });

    return { message: "Interest sent successfully.", interestId: interest.id, status: "PENDING" };
  }
}
