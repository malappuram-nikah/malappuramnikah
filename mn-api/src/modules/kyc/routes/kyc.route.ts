import { Router } from "express";
import { KycController } from "../controllers/kyc.controller";
import { SubmitKycUseCase } from "../application/use-cases/SubmitKyc.usecase";
import { GetKycDocumentUseCase } from "../application/use-cases/GetKycDocument.usecase";
import { PrismaKycRepository } from "../infrastructure/repositories/PrismaKycRepository";

const kycRouter = Router();

const kycRepository = new PrismaKycRepository();

const submitKycUseCase = new SubmitKycUseCase(kycRepository);
const getKycDocumentUseCase = new GetKycDocumentUseCase(kycRepository);

const kycController = new KycController(submitKycUseCase, getKycDocumentUseCase);

kycRouter.post("/kyc/submit", (req, res, next) => kycController.submitKyc(req, res, next));
kycRouter.get("/kyc/document/:fileName", (req, res, next) => kycController.getKycDocument(req, res, next));

export default kycRouter;
