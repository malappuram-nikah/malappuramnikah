import adminRouter, { adminGuard } from "./routes/admin.route";

export { adminRouter, adminGuard };
export * from "./domain/entities/admin.entity";
export * from "./domain/repositories/IAdminRepository";
