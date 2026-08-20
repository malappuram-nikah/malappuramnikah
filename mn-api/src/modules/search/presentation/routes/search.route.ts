import { Router } from "express";
import { SearchController } from "../controllers/search.controller";
import { authenticateUserOptional } from "../../../../shared/auth/auth.middleware";

const router = Router();

router.get("/profiles", authenticateUserOptional, SearchController.search);
router.get("/", authenticateUserOptional, SearchController.search);

export default router;
