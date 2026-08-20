import { IInterestRepository } from "../../domain/repositories/IInterestRepository";
import { InterestEntity, InterestStatus } from "../../domain/entities/interaction.entity";
import prisma from "../../../../shared/database/prisma";

export class PrismaInterestRepository implements IInterestRepository {
  async findInterest(senderId: number, receiverId: number): Promise<InterestEntity | null> {
    const record = await prisma.interest.findUnique({
      where: {
        sender_id_receiver_id: { sender_id: senderId, receiver_id: receiverId },
      },
    });
    return record ? (record as unknown as InterestEntity) : null;
  }

  async findInterestById(id: number): Promise<InterestEntity | null> {
    const record = await prisma.interest.findUnique({ where: { id } });
    return record ? (record as unknown as InterestEntity) : null;
  }

  async createInterest(senderId: number, receiverId: number): Promise<InterestEntity> {
    const record = await prisma.interest.create({
      data: { sender_id: senderId, receiver_id: receiverId, status: "PENDING" },
    });
    return record as unknown as InterestEntity;
  }

  async updateInterestStatus(id: number, status: InterestStatus): Promise<InterestEntity> {
    const record = await prisma.interest.update({
      where: { id },
      data: { status },
    });
    return record as unknown as InterestEntity;
  }

  async deleteInterest(id: number): Promise<void> {
    await prisma.interest.delete({ where: { id } });
  }

  async getSentInterests(userId: number): Promise<InterestEntity[]> {
    const records = await prisma.interest.findMany({
      where: { sender_id: userId },
      include: {
        receiver: {
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
    return records as unknown as InterestEntity[];
  }

  async getReceivedInterests(userId: number): Promise<InterestEntity[]> {
    const records = await prisma.interest.findMany({
      where: { receiver_id: userId },
      include: {
        sender: {
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
    return records as unknown as InterestEntity[];
  }
}
