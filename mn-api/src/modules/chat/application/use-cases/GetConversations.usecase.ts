import { IMessageRepository, PaginatedResult } from "../../domain/repositories/IMessageRepository";
import { ConversationSummary } from "../../domain/entities/message.entity";

export class GetConversationsUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(userId: number, page: number = 1, limit: number = 20): Promise<PaginatedResult<ConversationSummary>> {
    return await this.messageRepository.getConversationsForUser(userId, page, limit);
  }
}
