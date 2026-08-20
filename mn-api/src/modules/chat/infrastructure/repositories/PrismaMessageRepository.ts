import { IMessageRepository, PaginatedResult } from "../../domain/repositories/IMessageRepository";
import { MessageEntity, ConversationSummary } from "../../domain/entities/message.entity";
import prisma from "../../../../shared/database/prisma";

export class PrismaMessageRepository implements IMessageRepository {
  async createMessage(senderId: number, receiverId: number, content: string): Promise<MessageEntity> {
    const record = await prisma.message.create({
      data: { sender_id: senderId, receiver_id: receiverId, content },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            member_profile: { select: { first_name: true, last_name: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            member_profile: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });
    return record as unknown as MessageEntity;
  }

  async findMessageById(id: number): Promise<MessageEntity | null> {
    const record = await prisma.message.findUnique({ where: { id } });
    return record ? (record as unknown as MessageEntity) : null;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number, page: number = 1, limit: number = 50): Promise<PaginatedResult<MessageEntity>> {
    const skip = (page - 1) * limit;
    const whereCondition = {
      OR: [
        { sender_id: user1Id, receiver_id: user2Id },
        { sender_id: user2Id, receiver_id: user1Id },
      ],
    };

    const [total, records] = await Promise.all([
      prisma.message.count({ where: whereCondition }),
      prisma.message.findMany({
        where: whereCondition,
        orderBy: { created_at: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: records as unknown as MessageEntity[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getConversationsForUser(userId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<ConversationSummary>> {
    const skip = (page - 1) * limit;

    // Get latest messages grouped by distinct partner
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      orderBy: { created_at: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            member_profile: { select: { first_name: true, last_name: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            member_profile: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });

    const partnerMap = new Map<number, ConversationSummary>();

    for (const msg of messages) {
      const isSender = msg.sender_id === userId;
      const partnerId = isSender ? msg.receiver_id : msg.sender_id;

      if (!partnerMap.has(partnerId)) {
        const partnerUser = isSender ? msg.receiver : msg.sender;
        const profile = partnerUser?.member_profile;
        const partnerName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : `User #${partnerId}`;

        partnerMap.set(partnerId, {
          participantId: partnerId,
          participantName: partnerName,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        });
      }
    }

    const conversations = Array.from(partnerMap.values());
    const total = conversations.length;
    const paginated = conversations.slice(skip, skip + limit);

    // Calculate unread counts for paginated items
    for (const conv of paginated) {
      conv.unreadCount = await prisma.message.count({
        where: {
          sender_id: conv.participantId,
          receiver_id: userId,
          is_read: false,
        },
      });
    }

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<number> {
    const res = await prisma.message.updateMany({
      where: {
        sender_id: senderId,
        receiver_id: receiverId,
        is_read: false,
      },
      data: { is_read: true },
    });
    return res.count;
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await prisma.message.count({
      where: {
        receiver_id: userId,
        is_read: false,
      },
    });
  }
}
