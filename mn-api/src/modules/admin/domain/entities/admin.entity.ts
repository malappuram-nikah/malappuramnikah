export interface AdminEntity {
  id: number;
  name: string;
  email: string;
  mobile_number: string;
  password?: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
