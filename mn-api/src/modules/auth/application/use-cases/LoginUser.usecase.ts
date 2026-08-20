import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { generateToken } from "../../../../shared/auth/jwt.util";
import { config } from "../../../../config";
import { getAccountBlockForUser } from "../../../../infrastructure/helpers/accountStatus.helpers";
import { BadRequestError, NotFoundError, ForbiddenError, UnauthorizedError } from "../../../../shared/errors/AppError";

export interface LoginResult {
  status: number;
  message: string;
  code?: string;
  token?: string;
  refreshToken?: string;
}

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: { mobile_number: string; password: string }): Promise<LoginResult> {
    if (!data.mobile_number || !data.password) {
      throw new BadRequestError("Mobile number and password are required");
    }

    const user = await this.userRepository.findByMobile(data.mobile_number);
    if (!user) {
      return { status: 404, message: "User not found" };
    }

    const accountBlock = getAccountBlockForUser(user);
    if (accountBlock) {
      return { status: accountBlock.httpStatus, message: accountBlock.message, code: accountBlock.code };
    }

    if (user.status === "in_active") {
      return {
        status: 403,
        message: "Your account is not verified. Please complete OTP verification to activate your account.",
        code: "ACCOUNT_UNVERIFIED",
      };
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      return { status: 401, message: "Incorrect password" };
    }

    const accessToken = generateToken({ userId: user.id }, config.jwt.expiresIn);
    const refreshToken = generateToken({ userId: user.id }, "7d");

    if (user.id !== undefined) {
      this.userRepository.updateUser(user.id, { last_login: new Date() }).catch((err) =>
        console.error("Last login update failed:", err)
      );
    }

    return { status: 200, message: "Login successful", token: accessToken, refreshToken };
  }
}
