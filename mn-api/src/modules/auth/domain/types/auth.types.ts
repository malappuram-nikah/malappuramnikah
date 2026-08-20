export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthIdentityPayload {
  userId: number;
  mobile_number: string;
  email?: string | null;
  role?: string;
  isAdmin?: boolean;
}

export interface SessionState {
  sessionId: string;
  userId: number;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export interface OtpVerificationResult {
  verified: boolean;
  message: string;
  user?: any;
}
