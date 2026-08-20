import { Request, Response, NextFunction } from "express";
import { verifyToken, extractTokenFromRequest } from "./jwt.util";

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access. Token missing.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access. Token invalid or expired.",
      code: "INVALID_TOKEN",
    });
    return;
  }

  (req as any).user = {
    userId: payload.userId,
    mobile_number: payload.mobile_number,
    email: payload.email,
    role: payload.role,
    isAdmin: payload.isAdmin || false,
  };

  next();
}

export function authenticateUserOptional(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.userId) {
      (req as any).user = {
        userId: payload.userId,
        mobile_number: payload.mobile_number,
        email: payload.email,
        role: payload.role,
        isAdmin: payload.isAdmin || false,
      };
    }
  }
  next();
}
