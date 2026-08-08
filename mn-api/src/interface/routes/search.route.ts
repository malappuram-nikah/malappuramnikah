import { Router } from "express";
import { SearchController } from "../controllers/search.controller";

const search_route = Router();
const searchController = new SearchController();

search_route.get("/profiles", async (req, res) => {
  await searchController.searchProfiles(req, res);
});
search_route.post("/preferences", async (req, res) => {
  await searchController.updateSearchPreferences(req, res);
});


export default search_route;
