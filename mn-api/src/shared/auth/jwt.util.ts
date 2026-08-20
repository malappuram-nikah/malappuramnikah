import jwt from "jsonwebtoken";
import { Request } from "express";
import { config } from "../../config";

export interface JwtPayload {
  userId?: number;
  adminId?: number;
  role?: string;
  isAdmin?: boolean;
}

export function generateToken(payload: object, expiresIn?: string | number): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: (expiresIn || config.jwt.expiresIn) as any,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  if (authHeader && !authHeader.includes(" ")) {
    return authHeader;
  }
  if (req.query && req.query.token) {
    return req.query.token as string;
  }
  return null;
}

export function getUserIdFromRequest(req: Request): number | null {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) return null;
    const payload = verifyToken(token);
    return payload.userId || null;
  } catch (err: any) {
    if (err?.name !== "TokenExpiredError") {
      console.warn("Invalid JWT token provided:", err?.message || err);
    }
    return null;
  }
}

export function isAdminTokenFromRequest(req: Request): boolean {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) return false;
    const payload = verifyToken(token);
    return payload.isAdmin === true || payload.role === "admin" || payload.role === "SUPER_ADMIN" || payload.role === "SUPPORT";
  } catch {
    return false;
  }
}
