import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { GetChatHistoryUseCase } from "../application/use-cases/GetChatHistory.usecase";
import { SendMessageUseCase } from "../application/use-cases/SendMessage.usecase";
import { PrismaChatRepository } from "../infrastructure/repositories/PrismaChatRepository";
import { memberAccountGuard } from "../../../shared/authorization/memberAccount.guard";

const chatRouter = Router();
chatRouter.use(memberAccountGuard);

const chatRepository = new PrismaChatRepository();

const getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepository);
const sendMessageUseCase = new SendMessageUseCase(chatRepository);

const chatController = new ChatController(getChatHistoryUseCase, sendMessageUseCase);

chatRouter.get("/history/:peerId", (req, res, next) => chatController.getChatHistory(req, res, next));
chatRouter.post("/message", (req, res, next) => chatController.sendMessage(req, res, next));

export default chatRouter;
