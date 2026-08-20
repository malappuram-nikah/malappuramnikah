import { MessageEntity } from "../entities/message.entity";

export interface IChatRepository {
  verifyMutualMatch(userA: number, userB: number): Promise<boolean>;
  getChatHistory(userId: number, peerId: number): Promise<MessageEntity[]>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  createMessage(senderId: number, receiverId: number, content: string): Promise<MessageEntity>;
  getUserForChatCheck(userId: number): Promise<{ id: number; kyc_status: string; first_name: string; last_name: string } | null>;
  createMessageNotification(receiverId: number, senderId: number, senderName: string, content: string): Promise<void>;
}
