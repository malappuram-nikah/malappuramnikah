import prisma from "../prisma/prisamClient";

export interface AccountBlock {
  code: string;
  message: string;
  httpStatus: number;
}

export function getAccountBlockForUser(user: {
  status: string;
  last_login?: Date | null;
}): AccountBlock | null {
  if (user.status === "suspended") {
    return {
      code: "ACCOUNT_SUSPENDED",
      message: "Your account has been suspended. Please contact support for assistance.",
      httpStatus: 403,
    };
  }

  if (user.status === "in_active" && user.last_login) {
    return {
      code: "ACCOUNT_DEACTIVATED",
      message: "Your account has been deactivated. Please contact support if you believe this is a mistake.",
      httpStatus: 403,
    };
  }

  return null;
}

export async function assertActiveMemberAccount(userId: number): Promise<AccountBlock | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, last_login: true },
  });

  if (!user) {
    return {
      code: "USER_NOT_FOUND",
      message: "User not found",
      httpStatus: 404,
    };
  }

  return getAccountBlockForUser(user);
}
