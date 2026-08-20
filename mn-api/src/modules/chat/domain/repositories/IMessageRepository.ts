import { MessageEntity, ConversationSummary } from "../entities/message.entity";
import { PaginatedResult } from "../../../../shared/types/pagination.type";

export { PaginatedResult };

export interface IMessageRepository {
  createMessage(senderId: number, receiverId: number, content: string): Promise<MessageEntity>;
  findMessageById(id: number): Promise<MessageEntity | null>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number, page?: number, limit?: number): Promise<PaginatedResult<MessageEntity>>;
  getConversationsForUser(userId: number, page?: number, limit?: number): Promise<PaginatedResult<ConversationSummary>>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<number>;
  getUnreadCount(userId: number): Promise<number>;
}
