import { IMessageRepository } from "../../domain/repositories/IMessageRepository";

export class MarkMessagesAsReadUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(userId: number, targetUserId: number): Promise<{ count: number }> {
    const count = await this.messageRepository.markMessagesAsRead(targetUserId, userId);
    return { count };
  }
}
