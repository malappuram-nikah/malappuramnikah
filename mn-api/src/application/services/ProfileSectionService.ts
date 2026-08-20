import prisma from "../../infrastructure/prisma/prisamClient";
import { MediaStorageService } from "../../infrastructure/service/MediaStorageService";
import {
  calculateProfileCompletion,
  SECTION_SLUG_TO_DRAFT,
} from "./ProfileCompletionService";

export function mergeProfileDetails(
  existing: Record<string, unknown> | null | undefined,
  partial: Record<string, unknown>
): Record<string, unknown> {
  const base = { ...(existing || {}) };
  for (const key of Object.keys(partial)) {
    const incoming = partial[key];
    if (incoming !== null && typeof incoming === "object" && !Array.isArray(incoming)) {
      base[key] = {
        ...((base[key] as Record<string, unknown>) || {}),
        ...(incoming as Record<string, unknown>),
      };
    } else {
      base[key] = incoming;
    }
  }
  return base;
}

async function processMediaInSection(draftKey: string, sectionData: Record<string, unknown>) {
  if (draftKey === "mn_profile_photos_draft" && Array.isArray(sectionData.photos)) {
    const photos = sectionData.photos as Array<{ dataUrl?: string }>;
    for (const photo of photos) {
      if (photo.dataUrl?.startsWith("data:")) {
        try {
          photo.dataUrl = await MediaStorageService.uploadMedia(photo.dataUrl, "photos");
        } catch (err) {
          console.error("Failed to upload profile photo:", err);
        }
      }
    }
  }

  if (draftKey === "mn_voice_intro_draft") {
    const voice = sectionData.voice as { dataUrl?: string } | undefined;
    if (voice?.dataUrl?.startsWith("data:")) {
      try {
        voice.dataUrl = await MediaStorageService.uploadMedia(voice.dataUrl, "voices");
      } catch (err) {
        console.error("Failed to upload voice introduction:", err);
      }
    }
  }

  if (draftKey === "mn_video_intro_draft") {
    const video = sectionData.video as { dataUrl?: string } | undefined;
    if (video?.dataUrl?.startsWith("data:")) {
      try {
        video.dataUrl = await MediaStorageService.uploadMedia(video.dataUrl, "videos");
      } catch (err) {
        console.error("Failed to upload video introduction:", err);
      }
    }
  }
}

function syncCoreFieldsFromDrafts(mergedDetails: Record<string, unknown>) {
  const coreFields: Record<string, unknown> = {};
  const basic = (mergedDetails.mn_basic_details_draft || {}) as Record<string, unknown>;
  const religious = (mergedDetails.mn_religious_info_draft || {}) as Record<string, unknown>;

  if (basic.name) {
    const parts = String(basic.name).trim().split(/\s+/);
    coreFields.first_name = parts[0] || "";
    coreFields.last_name = parts.slice(1).join(" ") || "";
  }
  if (basic.gender) coreFields.gender = basic.gender;
  if (basic.presentLocation || basic.location) {
    coreFields.location = basic.presentLocation || basic.location;
  }
  if (basic.age) {
    const birthYear = new Date().getFullYear() - parseInt(String(basic.age), 10);
    if (!isNaN(birthYear)) coreFields.dob = `${birthYear}-01-01`;
  }
  if (religious.community) coreFields.cast = religious.community;
  if (basic.profileFor) coreFields.profile_for = basic.profileFor;

  return coreFields;
}

export async function getProfileSection(userId: number, sectionSlug: string) {
  const draftKey = SECTION_SLUG_TO_DRAFT[sectionSlug];
  if (!draftKey) {
    throw new Error(`Unknown profile section: ${sectionSlug}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile_details: true },
  });

  if (!user) throw new Error("User not found");

  const details = (user.profile_details || {}) as Record<string, unknown>;
  return {
    section: sectionSlug,
    draftKey,
    data: details[draftKey] || {},
  };
}

export async function updateProfileSection(
  userId: number,
  sectionSlug: string,
  sectionData: Record<string, unknown>
) {
  const draftKey = SECTION_SLUG_TO_DRAFT[sectionSlug];
  if (!draftKey) {
    throw new Error(`Unknown profile section: ${sectionSlug}`);
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile_details: true },
  });

  if (!existing) throw new Error("User not found");

  await processMediaInSection(draftKey, sectionData);

  const existingDetails = (existing.profile_details || {}) as Record<string, unknown>;
  const existingSection = (existingDetails[draftKey] || {}) as Record<string, unknown>;
  const mergedSection = { ...existingSection, ...sectionData };

  const mergedDetails = mergeProfileDetails(existingDetails, { [draftKey]: mergedSection });
  const coreFields = syncCoreFieldsFromDrafts(mergedDetails);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profile_details: mergedDetails as object,
      ...coreFields,
    },
  });

  const { password: _password, ...safeUser } = updatedUser;
  const profileCompletion = calculateProfileCompletion(updatedUser);

  return {
    user: safeUser,
    section: sectionSlug,
    draftKey,
    data: mergedSection,
    profileCompletion,
  };
}

export async function getProfileCompletionForUser(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  return calculateProfileCompletion(user);
}
