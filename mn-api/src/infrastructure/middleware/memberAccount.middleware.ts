import { NextFunction, Request, Response } from "express";
import { assertActiveMemberAccount } from "../helpers/accountStatus.helpers";
import { getUserIdFromRequest, isAdminTokenFromRequest } from "../../interface/routes/interest.route";

interface MemberAccountGuardOptions {
  /** Allow GET /:id when the requester reads their own profile (for status display). */
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

/** Blocks suspended/deactivated members on authenticated API routes. */
export const memberAccountGuard = createMemberAccountGuard();
