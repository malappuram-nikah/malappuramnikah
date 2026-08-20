import path from "path";
import fs from "fs";
import { IBusinessRepository, BiodataPermissionResult } from "../../domain/repositories/IBusinessRepository";
import { prisma, runInTransaction } from "../../../../infrastructure/database/prisma.service";

const STORE_PATH = path.join(process.cwd(), "src", "infrastructure", "data", "adminStore.json");

export class PrismaBusinessRepository implements IBusinessRepository {
  async toggleBlock(blockerId: number, targetId: number): Promise<string> {
    const existing = await prisma.block.findUnique({
      where: { blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: targetId } },
    });

    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      return "UNBLOCKED";
    } else {
      await runInTransaction(async (tx) => {
        await tx.block.create({ data: { blocker_id: blockerId, blocked_id: targetId } });
        await tx.interest.deleteMany({
          where: {
            OR: [
              { sender_id: blockerId, receiver_id: targetId },
              { sender_id: targetId, receiver_id: blockerId },
            ],
          },
        });
      });
      return "BLOCKED";
    }
  }

  async getBlockedIds(userId: number): Promise<number[]> {
    const blocks = await prisma.block.findMany({
      where: { blocker_id: userId },
      select: { blocked_id: true },
    });
    return blocks.map((b) => b.blocked_id);
  }

  async toggleFavourite(favouriterId: number, targetId: number): Promise<string> {
    const existing = await prisma.favourite.findUnique({
      where: { favouriter_id_favourited_id: { favouriter_id: favouriterId, favourited_id: targetId } },
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return "UNFAVOURITED";
    } else {
      await prisma.favourite.create({
        data: { favouriter_id: favouriterId, favourited_id: targetId },
      });
      return "FAVOURITED";
    }
  }

  async getFavouriteAndBlockedIds(userId: number): Promise<{ favourite_ids: number[]; blocked_ids: number[] }> {
    const [favs, blocks] = await Promise.all([
      prisma.favourite.findMany({ where: { favouriter_id: userId }, select: { favourited_id: true } }),
      prisma.block.findMany({ where: { blocker_id: userId }, select: { blocked_id: true } }),
    ]);

    return {
      favourite_ids: favs.map((f) => f.favourited_id),
      blocked_ids: blocks.map((b) => b.blocked_id),
    };
  }

  async createFeedback(userId: number, category: string, rating: number, subject: string, message: string): Promise<any> {
    return await prisma.feedback.create({
      data: {
        user_id: userId,
        category,
        rating,
        subject,
        message,
      },
    });
  }

  async checkBiodataAccessPermission(requesterId: number, targetUserId: number): Promise<BiodataPermissionResult> {
    if (requesterId === targetUserId) {
      return { allowed: true, status: "ACCEPTED", isSelf: true };
    }

    const interest = await prisma.interest.findFirst({
      where: {
        OR: [
          { sender_id: requesterId, receiver_id: targetUserId },
          { sender_id: targetUserId, receiver_id: requesterId },
        ],
      },
    });

    if (interest && interest.status === "ACCEPTED") {
      return { allowed: true, status: "ACCEPTED", isSelf: false };
    }

    const currentStatus = interest ? interest.status : "NONE";
    return {
      allowed: false,
      status: currentStatus,
      isSelf: false,
      message: "Access denied. Biodata is available after the profile owner accepts your invite.",
    };
  }

  isBiodataDownloadEnabled(): boolean {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
        if (store.biodata_settings?.enable_download === false) {
          return false;
        }
      } catch {}
    }
    return true;
  }

  async recordBiodataDownload(requesterId: number, targetUserId: number): Promise<void> {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
        const [requester, targetUser] = await Promise.all([
          prisma.user.findUnique({ where: { id: requesterId } }),
          prisma.user.findUnique({ where: { id: targetUserId } }),
        ]);

        const requesterName = requester ? `${requester.first_name} ${requester.last_name}` : `User #${requesterId}`;
        const targetName = targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : `User #${targetUserId}`;

        if (!store.biodata_downloads) store.biodata_downloads = [];
        store.biodata_downloads.unshift({
          id: Date.now(),
          user_id: requesterId,
          user_name: requesterName,
          target_user_id: targetUserId,
          target_user_name: targetName,
          downloaded_at: new Date().toISOString().replace("T", " ").substring(0, 19),
        });
        if (store.biodata_downloads.length > 500) {
          store.biodata_downloads = store.biodata_downloads.slice(0, 500);
        }
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
      } catch {}
    }
  }

  async getUserById(id: number | string): Promise<any> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    if (isNaN(numericId)) return null;
    return await prisma.user.findUnique({ where: { id: numericId } });
  }
}
