export interface TokenPayload {
  userId?: number;
  adminId?: number;
  mobile_number?: string;
  email?: string | null;
  role?: string;
  isAdmin?: boolean;
  type?: string;
  [key: string]: any;
}

export interface ITokenProvider {
  generateToken(payload: TokenPayload, expiresIn?: string | number): string;
  verifyToken(token: string): TokenPayload;
}
