import { Request, Response, NextFunction } from "express";
import { getUserIdFromRequest, isAdminTokenFromRequest } from "../auth/jwt.util";
import { assertActiveMemberAccount } from "../../infrastructure/helpers/accountStatus.helpers";

export interface MemberAccountGuardOptions {
  allowSelfProfileGet?: boolean;
}

function parseRouteId(value: string | string[] | undefined): number | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getSelfProfileIdFromRequest(req: Request): number | null {
  if (req.method !== "GET") return null;

  const routeId = parseRouteId(req.params.id ?? req.params.targetId);
  if (routeId !== null) return routeId;

  const pathMatch = req.path.match(/^\/(\d+)\/?$/);
  if (!pathMatch) return null;

  const parsed = parseInt(pathMatch[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function createMemberAccountGuard(options: MemberAccountGuardOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserIdFromRequest(req);
    if (!userId || isAdminTokenFromRequest(req)) {
      next();
      return;
    }

    if (options.allowSelfProfileGet) {
      const routeId = getSelfProfileIdFromRequest(req);
      if (routeId === userId) {
        next();
        return;
      }
    }

    const block = await assertActiveMemberAccount(userId);
    if (block) {
      res.status(block.httpStatus).json({
        success: false,
        message: block.message,
        code: block.code,
      });
      return;
    }

    next();
  };
}

export const memberAccountGuard = createMemberAccountGuard();
