import matchingRoutes from "./presentation/routes/matching.route";

export { matchingRoutes, matchingRoutes as matchingRouter };
export * from "./presentation/controllers/matching.controller";
export * from "./domain/services/MatchingCalculator";
export * from "./application/use-cases/CalculateMatchScore.usecase";
export * from "./application/use-cases/GetRecommendedMatches.usecase";
