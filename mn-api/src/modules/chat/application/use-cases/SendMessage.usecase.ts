import { IChatRepository } from "../../domain/repositories/IChatRepository";
import { MessageEntity } from "../../domain/entities/message.entity";
import { socketService } from "../../../../infrastructure/websocket/socket.service";
import { BadRequestError, ForbiddenError } from "../../../../shared/errors/AppError";

export class SendMessageUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(senderId: number, receiverId: number, content: string): Promise<{ message: MessageEntity; requireKyc?: boolean }> {
    if (isNaN(receiverId) || !content || !content.trim()) {
      throw new BadRequestError("Invalid payload parameters");
    }

    const senderUserRecord = await this.chatRepository.getUserForChatCheck(senderId);
    if (!senderUserRecord || senderUserRecord.kyc_status !== "VERIFIED") {
      resCustomKycError();
    }

    const isMatched = await this.chatRepository.verifyMutualMatch(senderId, receiverId);
    if (!isMatched) {
      throw new ForbiddenError("Chat locked. You must establish a mutual match to send messages.");
    }

    const message = await this.chatRepository.createMessage(senderId, receiverId, content.trim());

    const senderName = senderUserRecord
      ? `${senderUserRecord.first_name} ${senderUserRecord.last_name}`
      : "Someone";

    socketService.emitToUser(receiverId, "private_message", message);
    socketService.emitToUser(senderId, "private_message", message);

    socketService.emitToUser(receiverId, "notification", {
      type: "NEW_MESSAGE",
      title: `New Message from ${senderName}`,
      message: content.length > 40 ? `${content.substring(0, 37)}...` : content,
    });

    await this.chatRepository.createMessageNotification(receiverId, senderId, senderName, content.trim());

    return { message };
  }
}

function resCustomKycError(): never {
  const err = new ForbiddenError(
    "Identity verification required to send chat messages. Please complete your ID verification in settings."
  );
  (err as any).requireKyc = true;
  throw err;
}
