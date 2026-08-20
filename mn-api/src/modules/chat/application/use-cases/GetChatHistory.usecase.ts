import { IChatRepository } from "../../domain/repositories/IChatRepository";
import { MessageEntity } from "../../domain/entities/message.entity";
import { BadRequestError, ForbiddenError } from "../../../../shared/errors/AppError";

export class GetChatHistoryUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(userId: number, peerId: number): Promise<MessageEntity[]> {
    if (isNaN(peerId)) {
      throw new BadRequestError("Invalid peer ID");
    }

    const isMatched = await this.chatRepository.verifyMutualMatch(userId, peerId);
    if (!isMatched) {
      throw new ForbiddenError("Chat locked. You must establish a mutual match to chat.");
    }

    const messages = await this.chatRepository.getChatHistory(userId, peerId);

    // Mark messages from peer as read asynchronously
    this.chatRepository.markMessagesAsRead(peerId, userId).catch((err) =>
      console.error("Failed to mark messages as read:", err)
    );

    return messages;
  }
}
