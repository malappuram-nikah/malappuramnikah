import { Router } from "express";
import { BusinessController } from "../controllers/business.controller";
import { ToggleBlockUseCase } from "../application/use-cases/ToggleBlock.usecase";
import { GetBlockedListUseCase } from "../application/use-cases/GetBlockedList.usecase";
import { ToggleFavouriteUseCase } from "../application/use-cases/ToggleFavourite.usecase";
import { GetFavouritesListUseCase } from "../application/use-cases/GetFavouritesList.usecase";
import { SubmitFeedbackUseCase } from "../application/use-cases/SubmitFeedback.usecase";
import { CheckBiodataPermissionUseCase } from "../application/use-cases/CheckBiodataPermission.usecase";
import { DownloadBiodataUseCase } from "../application/use-cases/DownloadBiodata.usecase";
import { PrismaBusinessRepository } from "../infrastructure/repositories/PrismaBusinessRepository";
import { memberAccountGuard } from "../../../shared/authorization/memberAccount.guard";

const businessRouter = Router();
businessRouter.use(memberAccountGuard);

const businessRepository = new PrismaBusinessRepository();

const toggleBlockUseCase = new ToggleBlockUseCase(businessRepository);
const getBlockedListUseCase = new GetBlockedListUseCase(businessRepository);
const toggleFavouriteUseCase = new ToggleFavouriteUseCase(businessRepository);
const getFavouritesListUseCase = new GetFavouritesListUseCase(businessRepository);
const submitFeedbackUseCase = new SubmitFeedbackUseCase(businessRepository);
const checkBiodataPermissionUseCase = new CheckBiodataPermissionUseCase(businessRepository);
const downloadBiodataUseCase = new DownloadBiodataUseCase(businessRepository);

const businessController = new BusinessController(
  toggleBlockUseCase,
  getBlockedListUseCase,
  toggleFavouriteUseCase,
  getFavouritesListUseCase,
  submitFeedbackUseCase,
  checkBiodataPermissionUseCase,
  downloadBiodataUseCase
);

businessRouter.post("/block", (req, res, next) => businessController.toggleBlock(req, res, next));
businessRouter.get("/block", (req, res, next) => businessController.getBlockedList(req, res, next));
businessRouter.post("/favourite", (req, res, next) => businessController.toggleFavourite(req, res, next));
businessRouter.get("/favourite", (req, res, next) => businessController.getFavouritesList(req, res, next));
businessRouter.post("/feedback", (req, res, next) => businessController.submitFeedback(req, res, next));

businessRouter.get("/biodata/check-permission/:targetId", (req, res, next) => businessController.checkBiodataPermission(req, res, next));
businessRouter.get("/biodata/download/:targetId", (req, res, next) => businessController.downloadBiodata(req, res, next));
businessRouter.post("/biodata/download", (req, res, next) => businessController.downloadBiodata(req, res, next));

export default businessRouter;
export { businessController };
