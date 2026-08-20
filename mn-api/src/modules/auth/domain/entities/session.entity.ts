export interface SessionEntity {
  id: string;
  user_id: number;
  refresh_token: string;
  user_agent?: string;
  ip_address?: string;
  is_revoked: boolean;
  expires_at: Date;
  created_at: Date;
}
