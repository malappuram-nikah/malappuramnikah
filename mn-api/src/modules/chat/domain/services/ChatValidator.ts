import { BadRequestError, ForbiddenError, NotFoundError } from "../../../../shared/errors/AppError";

export class ChatValidator {
  static validateSelfMessaging(senderId: number, receiverId: number): void {
    if (senderId === receiverId) {
      throw new BadRequestError("You cannot send messages to yourself.");
    }
  }

  static validateMessageContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new BadRequestError("Message content cannot be empty.");
    }
    if (content.length > 2000) {
      throw new BadRequestError("Message content exceeds maximum limit of 2000 characters.");
    }
  }

  static validateUserStatus(receiverUser: { id: number; status?: string } | null): void {
    if (!receiverUser) {
      throw new NotFoundError("Receiver account not found.");
    }
    if (receiverUser.status === "SUSPENDED" || receiverUser.status === "DELETED") {
      throw new ForbiddenError(`Cannot send messages to a ${receiverUser.status.toLowerCase()} account.`);
    }
  }

  static validateNotBlocked(isBlocked: boolean): void {
    if (isBlocked) {
      throw new ForbiddenError("Cannot send messages to a blocked user.");
    }
  }

  static validateOwnership(messageSenderId: number, requestingUserId: number): void {
    if (messageSenderId !== requestingUserId) {
      throw new ForbiddenError("You are not authorized to manipulate this message.");
    }
  }
}
