import { ProfileViewEntity } from "../entities/interaction.entity";

export interface IProfileViewRepository {
  findView(viewerId: number, viewedId: number): Promise<ProfileViewEntity | null>;
  recordView(viewerId: number, viewedId: number): Promise<ProfileViewEntity>;
  getViewsGiven(viewerId: number): Promise<ProfileViewEntity[]>;
  getViewsReceived(viewedId: number): Promise<ProfileViewEntity[]>;
}
