import { IMessageRepository } from "../../domain/repositories/IMessageRepository";

export class GetUnreadMessageCountUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(userId: number): Promise<{ unreadCount: number }> {
    const unreadCount = await this.messageRepository.getUnreadCount(userId);
    return { unreadCount };
  }
}
