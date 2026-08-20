export interface LoginUserDto {
  identifier?: string;
  mobile_number?: string;
  email?: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}
