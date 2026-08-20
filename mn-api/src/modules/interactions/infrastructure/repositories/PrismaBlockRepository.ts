import { IBlockRepository } from "../../domain/repositories/IBlockRepository";
import { BlockEntity } from "../../domain/entities/interaction.entity";
import prisma from "../../../../shared/database/prisma";

export class PrismaBlockRepository implements IBlockRepository {
  async findBlock(blockerId: number, blockedId: number): Promise<BlockEntity | null> {
    const record = await prisma.block.findUnique({
      where: {
        blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId },
      },
    });
    return record ? (record as unknown as BlockEntity) : null;
  }

  async isBlockedEither(userAId: number, userBId: number): Promise<boolean> {
    const record = await prisma.block.findFirst({
      where: {
        OR: [
          { blocker_id: userAId, blocked_id: userBId },
          { blocker_id: userBId, blocked_id: userAId },
        ],
      },
    });
    return !!record;
  }

  async blockUser(blockerId: number, blockedId: number): Promise<BlockEntity> {
    const record = await prisma.block.create({
      data: { blocker_id: blockerId, blocked_id: blockedId },
    });
    return record as unknown as BlockEntity;
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    await prisma.block.deleteMany({
      where: { blocker_id: blockerId, blocked_id: blockedId },
    });
  }

  async getBlockedUsers(blockerId: number): Promise<BlockEntity[]> {
    const records = await prisma.block.findMany({
      where: { blocker_id: blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            email: true,
            member_profile: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return records as unknown as BlockEntity[];
  }

  async getBlockedUserIds(blockerId: number): Promise<number[]> {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blocker_id: blockerId }, { blocked_id: blockerId }],
      },
      select: { blocker_id: true, blocked_id: true },
    });
    const ids = new Set<number>();
    for (const b of blocks) {
      if (b.blocker_id !== blockerId) ids.add(b.blocker_id);
      if (b.blocked_id !== blockerId) ids.add(b.blocked_id);
    }
    return Array.from(ids);
  }
}
