import { IChatRepository } from "../../domain/repositories/IChatRepository";
import { MessageEntity } from "../../domain/entities/message.entity";
import { prisma } from "../../../../infrastructure/database/prisma.service";

export class PrismaChatRepository implements IChatRepository {
  async verifyMutualMatch(userA: number, userB: number): Promise<boolean> {
    const match = await prisma.interest.findFirst({
      where: {
        OR: [
          { sender_id: userA, receiver_id: userB, status: "ACCEPTED" },
          { sender_id: userB, receiver_id: userA, status: "ACCEPTED" },
        ],
      },
    });
    return !!match;
  }

  async getChatHistory(userId: number, peerId: number): Promise<MessageEntity[]> {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId, receiver_id: peerId },
          { sender_id: peerId, receiver_id: userId },
        ],
      },
      orderBy: { created_at: "asc" },
    });
    return messages as unknown as MessageEntity[];
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    await prisma.message.updateMany({
      where: { sender_id: senderId, receiver_id: receiverId, is_read: false },
      data: { is_read: true },
    });
  }

  async createMessage(senderId: number, receiverId: number, content: string): Promise<MessageEntity> {
    const created = await prisma.message.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      },
    });
    return created as unknown as MessageEntity;
  }

  async getUserForChatCheck(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kyc_status: true,
        first_name: true,
        last_name: true,
      },
    });
  }

  async createMessageNotification(receiverId: number, senderId: number, senderName: string, content: string): Promise<void> {
    await prisma.notification.create({
      data: {
        user_id: receiverId,
        sender_id: senderId,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: `${senderName}: "${content.length > 50 ? content.substring(0, 47) + "..." : content}"`,
      },
    });
  }
}
