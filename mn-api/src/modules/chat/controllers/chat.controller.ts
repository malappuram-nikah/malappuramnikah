import { Request, Response, NextFunction } from "express";
import { GetChatHistoryUseCase } from "../application/use-cases/GetChatHistory.usecase";
import { SendMessageUseCase } from "../application/use-cases/SendMessage.usecase";
import { getUserIdFromRequest } from "../../../shared/auth/jwt.util";
import { sendSuccess } from "../../../shared/utils/response.util";
import { UnauthorizedError, BadRequestError } from "../../../shared/errors/AppError";

export class ChatController {
  constructor(
    private getChatHistoryUseCase: GetChatHistoryUseCase,
    private sendMessageUseCase: SendMessageUseCase
  ) {}

  async getChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const peerId = parseInt(Array.isArray(req.params.peerId) ? req.params.peerId[0] : req.params.peerId, 10);
      if (isNaN(peerId)) {
        throw new BadRequestError("Invalid peer ID");
      }

      const messages = await this.getChatHistoryUseCase.execute(userId, peerId);
      sendSuccess(res, { messages }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = getUserIdFromRequest(req);
      if (!senderId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const receiverId = parseInt(req.body.receiver_id, 10);
      const content = req.body.content?.trim();

      if (isNaN(receiverId) || !content) {
        throw new BadRequestError("Invalid payload parameters");
      }

      const result = await this.sendMessageUseCase.execute(senderId, receiverId, content);
      sendSuccess(res, { message: result.message }, undefined, 201);
    } catch (error: any) {
      if (error?.requireKyc) {
        res.status(403).json({
          success: false,
          requireKyc: true,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }
}
