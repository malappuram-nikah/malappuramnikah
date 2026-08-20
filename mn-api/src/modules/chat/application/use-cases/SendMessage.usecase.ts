import { IMessageRepository } from "../../domain/repositories/IMessageRepository";
import { IBlockRepository } from "../../../interactions/domain/repositories/IBlockRepository";
import { ChatValidator } from "../../domain/services/ChatValidator";
import { MessageEntity } from "../../domain/entities/message.entity";
import { eventBus } from "../../../../shared/events/EventBus";
import prisma from "../../../../shared/database/prisma";

export interface SendMessageDto {
  senderId: number;
  receiverId: number;
  content: string;
}

export class SendMessageUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private blockRepository: IBlockRepository
  ) {}

  async execute(dto: SendMessageDto): Promise<MessageEntity> {
    ChatValidator.validateSelfMessaging(dto.senderId, dto.receiverId);
    ChatValidator.validateMessageContent(dto.content);

    const receiver = await prisma.user.findUnique({
      where: { id: dto.receiverId },
      select: { id: true, status: true },
    });
    ChatValidator.validateUserStatus(receiver);

    const isBlocked = await this.blockRepository.isBlockedEither(dto.senderId, dto.receiverId);
    ChatValidator.validateNotBlocked(isBlocked);

    const message = await this.messageRepository.createMessage(dto.senderId, dto.receiverId, dto.content.trim());

    // Publish application event for decoupled notification dispatching
    await eventBus.publish("MESSAGE_SENT", {
      messageId: message.id,
      senderId: dto.senderId,
      receiverId: dto.receiverId,
      content: message.content,
    });

    return message;
  }
}
