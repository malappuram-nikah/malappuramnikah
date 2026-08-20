import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";
import { sendError } from "../utils/response.util";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return sendError(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      (err as any).errors ? { errors: (err as any).errors } : {}
    );
  }

  // Handle Prisma / Database operational errors gracefully
  if ((err as any).code === "P2002") {
    const target = (err as any).meta?.target;
    const targetStr = Array.isArray(target) ? target.join(",") : String(target || "");
    let msg = "An account with these details already exists.";
    if (targetStr.includes("email") || err.message?.includes("email")) {
      msg = "Email address is already registered. Please log in or use a different email.";
    } else if (targetStr.includes("mobile_number") || err.message?.includes("mobile_number")) {
      msg = "Mobile number is already registered. Please log in instead.";
    }
    return sendError(res, msg, 400, "DUPLICATE_RESOURCE");
  }

  console.error(`[UNHANDLED ERROR] ${req.method} ${req.path}:`, err.stack || err.message);

  return sendError(
    res,
    process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message || "Internal Server Error",
    500
  );
}
