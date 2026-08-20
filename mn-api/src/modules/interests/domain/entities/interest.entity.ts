export interface InterestEntity {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | string;
  created_at: Date;
  updated_at: Date;
}
