import { IProfileViewRepository } from "../../domain/repositories/IProfileViewRepository";
import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { InteractionValidator } from "../../domain/services/InteractionValidator";
import prisma from "../../../../shared/database/prisma";

export class RecordProfileViewUseCase {
  constructor(
    private profileViewRepository: IProfileViewRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(viewerId: number, viewedId: number): Promise<{ message: string; recorded: boolean }> {
    if (viewerId === viewedId) {
      return { message: "Self profile view ignored.", recorded: false };
    }

    const viewedUser = await prisma.user.findUnique({
      where: { id: viewedId },
      select: { id: true, status: true },
    });
    InteractionValidator.validateUserStatus(viewedUser);

    const isBlocked = await this.blockRepository.isBlockedEither(viewerId, viewedId);
    if (isBlocked) {
      return { message: "Profile view not recorded for blocked relationship.", recorded: false };
    }

    // Check privacy settings if available
    const privacy = await prisma.memberPrivacy.findUnique({
      where: { user_id: viewedId },
    });
    if (privacy?.photo_privacy === "PRIVATE") {
      return { message: "Profile is private.", recorded: false };
    }

    await this.profileViewRepository.recordView(viewerId, viewedId);

    // Optional notification
    await prisma.notification.create({
      data: {
        user_id: viewedId,
        sender_id: viewerId,
        type: "PROFILE_VIEW",
        title: "Profile Viewed",
        message: "Someone viewed your profile.",
      },
    });

    return { message: "Profile view recorded.", recorded: true };
  }
}
