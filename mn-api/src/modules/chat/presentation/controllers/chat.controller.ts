import { Request, Response, NextFunction } from "express";
import { SendMessageUseCase } from "../../application/use-cases/SendMessage.usecase";
import { GetConversationsUseCase } from "../../application/use-cases/GetConversations.usecase";
import { GetMessagesUseCase } from "../../application/use-cases/GetMessages.usecase";
import { MarkMessagesAsReadUseCase } from "../../application/use-cases/MarkMessagesAsRead.usecase";
import { GetUnreadMessageCountUseCase } from "../../application/use-cases/GetUnreadMessageCount.usecase";

import { PrismaMessageRepository } from "../../infrastructure/repositories/PrismaMessageRepository";
import { PrismaBlockRepository } from "../../../interactions/infrastructure/repositories/PrismaBlockRepository";
import { sendSuccess } from "../../../../shared/utils/response.util";
import { BadRequestError } from "../../../../shared/errors/AppError";

const messageRepo = new PrismaMessageRepository();
const blockRepo = new PrismaBlockRepository();

const sendMessageUseCase = new SendMessageUseCase(messageRepo, blockRepo);
const getConversationsUseCase = new GetConversationsUseCase(messageRepo);
const getMessagesUseCase = new GetMessagesUseCase(messageRepo, blockRepo);
const markMessagesAsReadUseCase = new MarkMessagesAsReadUseCase(messageRepo);
const getUnreadMessageCountUseCase = new GetUnreadMessageCountUseCase(messageRepo);

export class ChatController {
  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = (req as any).user?.userId;
      const receiverId = parseInt(req.body.receiver_id || req.body.receiverId, 10);
      const content = req.body.content;

      if (isNaN(receiverId)) {
        throw new BadRequestError("Valid receiver_id is required.");
      }

      const message = await sendMessageUseCase.execute({ senderId, receiverId, content });
      sendSuccess(res, message, "Message sent successfully.", 201);
    } catch (err) {
      next(err);
    }
  }

  static async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const conversations = await getConversationsUseCase.execute(userId, page, limit);
      sendSuccess(res, conversations, "Conversations retrieved successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const targetUserId = parseInt(req.params.targetUserId || req.query.targetUserId as string, 10);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      if (isNaN(targetUserId)) {
        throw new BadRequestError("Valid targetUserId is required.");
      }

      const result = await getMessagesUseCase.execute(userId, targetUserId, page, limit);
      sendSuccess(res, result, "Messages retrieved successfully.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const targetUserId = parseInt(req.params.targetUserId || req.body.targetUserId, 10);

      if (isNaN(targetUserId)) {
        throw new BadRequestError("Valid targetUserId is required.");
      }

      const result = await markMessagesAsReadUseCase.execute(userId, targetUserId);
      sendSuccess(res, result, "Messages marked as read.", 200);
    } catch (err) {
      next(err);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const result = await getUnreadMessageCountUseCase.execute(userId);
      sendSuccess(res, result, "Unread count retrieved.", 200);
    } catch (err) {
      next(err);
    }
  }
}
