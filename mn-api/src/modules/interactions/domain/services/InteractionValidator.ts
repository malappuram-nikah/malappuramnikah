import { BadRequestError, ForbiddenError, NotFoundError } from "../../../../shared/errors/AppError";

export class InteractionValidator {
  static validateSelfInteraction(actorId: number, targetId: number, actionName: string = "interact with"): void {
    if (actorId === targetId) {
      throw new BadRequestError(`You cannot ${actionName} yourself.`);
    }
  }

  static validateUserStatus(targetUser: { id: number; status?: string } | null): void {
    if (!targetUser) {
      throw new NotFoundError("Target user account not found.");
    }

    if (targetUser.status === "SUSPENDED" || targetUser.status === "DELETED") {
      throw new ForbiddenError(`Cannot interact with a ${targetUser.status.toLowerCase()} user account.`);
    }
  }

  static validateNotBlocked(isBlocked: boolean): void {
    if (isBlocked) {
      throw new ForbiddenError("Cannot interact with a blocked user.");
    }
  }

  static validateOwnership(ownerId: number, requestingUserId: number): void {
    if (ownerId !== requestingUserId) {
      throw new ForbiddenError("You are not authorized to manipulate this interaction.");
    }
  }
}
