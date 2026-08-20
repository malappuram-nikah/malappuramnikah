import { IMessageRepository, PaginatedResult } from "../../domain/repositories/IMessageRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";
import { MessageEntity } from "../../domain/entities/message.entity";
import { ChatValidator } from "../../domain/services/ChatValidator";

export class GetMessagesUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(userId: number, targetUserId: number, page: number = 1, limit: number = 50): Promise<PaginatedResult<MessageEntity>> {
    ChatValidator.validateSelfMessaging(userId, targetUserId);

    const isBlocked = await this.blockRepository.isBlockedEither(userId, targetUserId);
    ChatValidator.validateNotBlocked(isBlocked);

    return await this.messageRepository.getMessagesBetweenUsers(userId, targetUserId, page, limit);
  }
}
