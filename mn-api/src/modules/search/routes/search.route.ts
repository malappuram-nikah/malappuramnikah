import { Router } from "express";
import { SearchController } from "../controllers/search.controller";
import { SearchProfilesUseCase } from "../application/use-cases/SearchProfiles.usecase";
import { UpdateSearchPreferencesUseCase } from "../application/use-cases/UpdateSearchPreferences.usecase";
import { PrismaSearchRepository } from "../infrastructure/repositories/PrismaSearchRepository";
import { memberAccountGuard } from "../../../shared/authorization/memberAccount.guard";

const searchRouter = Router();
searchRouter.use(memberAccountGuard);

const searchRepository = new PrismaSearchRepository();

const searchProfilesUseCase = new SearchProfilesUseCase(searchRepository);
const updateSearchPreferencesUseCase = new UpdateSearchPreferencesUseCase(searchRepository);

const searchController = new SearchController(searchProfilesUseCase, updateSearchPreferencesUseCase);

searchRouter.get("/profiles", (req, res, next) => searchController.searchProfiles(req, res, next));
searchRouter.post("/preferences", (req, res, next) => searchController.updatePreferences(req, res, next));

export default searchRouter;
