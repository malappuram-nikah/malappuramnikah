import { Router } from "express";
import { InterestController } from "../controllers/interest.controller";
import { ExpressInterestUseCase } from "../application/use-cases/ExpressInterest.usecase";
import { GetUserInterestsUseCase } from "../application/use-cases/GetUserInterests.usecase";
import { PrismaInterestRepository } from "../infrastructure/repositories/PrismaInterestRepository";
import { memberAccountGuard } from "../../../shared/authorization/memberAccount.guard";

const interestRouter = Router();
interestRouter.use(memberAccountGuard);

const interestRepository = new PrismaInterestRepository();
const expressInterestUseCase = new ExpressInterestUseCase(interestRepository);
const getUserInterestsUseCase = new GetUserInterestsUseCase(interestRepository);

const interestController = new InterestController(expressInterestUseCase, getUserInterestsUseCase);

interestRouter.post("/", (req, res, next) => interestController.expressInterest(req, res, next));
interestRouter.get("/", (req, res, next) => interestController.getInterests(req, res, next));

export default interestRouter;
