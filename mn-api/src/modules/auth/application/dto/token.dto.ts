export interface RefreshTokenDto {
  refreshToken?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface LogoutDto {
  refreshToken?: string;
  userId?: number;
}
