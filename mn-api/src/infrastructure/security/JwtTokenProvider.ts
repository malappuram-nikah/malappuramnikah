import { ITokenProvider, TokenPayload } from "../../shared/security/ITokenProvider";
import { generateToken, verifyToken } from "../../shared/auth/jwt.util";

export class JwtTokenProvider implements ITokenProvider {
  generateToken(payload: TokenPayload, expiresIn?: string | number): string {
    return generateToken(payload, expiresIn);
  }

  verifyToken(token: string): TokenPayload {
    return verifyToken(token) as TokenPayload;
  }
}
