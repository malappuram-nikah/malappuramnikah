import { IProfileRepository, GetProfilesOptions } from "../../domain/repositories/IProfileRepository";
import { ProfileEntity } from "../../domain/entities/profile.entity";
import { socketService } from "../../../../infrastructure/websocket/socket.service";

export class GetProfilesUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(options: GetProfilesOptions, requesterId: number, isAdmin: boolean): Promise<ProfileEntity[]> {
    const requester = await this.profileRepository.findById(requesterId);
    if (!requester) {
      return [];
    }

    let searchOptions = { ...options };
    if (!isAdmin) {
      const reqGender = (requester.gender || "").toLowerCase();
      const oppositeGender = reqGender === "male" ? "female" : reqGender === "female" ? "male" : null;
      if (!oppositeGender) return [];
      searchOptions.gender = oppositeGender;
    }

    const rawUsers = await this.profileRepository.findProfiles(searchOptions);

    return rawUsers.map((u) => {
      const { password, ...safeUser } = u as any;
      if (safeUser.profile_details) {
        const details = { ...safeUser.profile_details };
        if (details.mn_video_intro_draft?.video?.dataUrl?.startsWith("data:")) {
          details.mn_video_intro_draft = {
            ...details.mn_video_intro_draft,
            video: { ...details.mn_video_intro_draft.video, dataUrl: "" },
          };
        }
        if (details.mn_voice_intro_draft?.voice?.dataUrl?.startsWith("data:")) {
          details.mn_voice_intro_draft = {
            ...details.mn_voice_intro_draft,
            voice: { ...details.mn_voice_intro_draft.voice, dataUrl: "" },
          };
        }
        if (details.mn_profile_photos_draft?.photos) {
          details.mn_profile_photos_draft = {
            ...details.mn_profile_photos_draft,
            photos: details.mn_profile_photos_draft.photos.map((p: any) => {
              if (p.isPrimary) return p;
              if (p.dataUrl?.startsWith("data:")) return { ...p, dataUrl: "" };
              return p;
            }),
          };
        }
        safeUser.profile_details = details;
      }

      return {
        ...safeUser,
        is_online: socketService.isUserOnline(safeUser.id),
      };
    });
  }
}
