import { IUserRepository } from "../../../domain/interfaces/IUserRepository";
import { accessTokenConfig, refreshTokenConfig } from "../../../infrastructure/config/jwt.config";
import { getAccountBlockForUser } from "../../../infrastructure/helpers/accountStatus.helpers";
import { AuthService } from "../../../infrastructure/service/AuthService.service";
import { LoginResponse } from "../../dto/LoginResponse";

export class LoginUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: { mobile_number: string; password: string }): Promise<LoginResponse> {
    this.validateInput(data);

    const user = await this.userRepository.findByMobile(data.mobile_number);
    if (!user) {
      return { status: 404, message: "User not found" };
    }

    const accountBlock = getAccountBlockForUser(user);
    if (accountBlock) {
      return { status: accountBlock.httpStatus, message: accountBlock.message, code: accountBlock.code };
    }

    const isValidPassword = await this.userRepository.validatePassword(data.password, user.password);
    if (!isValidPassword) {
      return { status: 401, message: 'Incorrect password' };
    }

    const accessToken = AuthService.generateToken(
      { userId: user.id }, 
      accessTokenConfig
    );

    const refreshToken = AuthService.generateToken(
      { userId: user.id },
      refreshTokenConfig
    );

    // Update last login timestamp asynchronously
    if (user.id !== undefined) {
      this.userRepository.updateLastLogin(user.id).catch(err => console.error("Last login update failed:", err));
    }

    return { status: 200, message: 'Login successful', token: accessToken, refreshToken };
  }

  private validateInput(data: { mobile_number: string; password: string }): void {
    if (!data.mobile_number || !data.password) {
      throw new Error("Mobile number and password are required");
    }
  }
}
