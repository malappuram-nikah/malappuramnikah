import { API_URL } from "./config";
import { getToken } from "./auth-session";

export interface ProfileSectionCompletion {
  id: string;
  name: string;
  draftKey: string;
  weight: number;
  step: number;
  status: "complete" | "partial" | "empty";
  percentage: number;
  missingFields: string[];
  suggestion: string;
}

export interface ProfileCompletionResult {
  percentage: number;
  strength: "Weak" | "Average" | "Strong" | "Excellent";
  completedSections: number;
  totalSections: number;
  sections: ProfileSectionCompletion[];
  incompleteSections: ProfileSectionCompletion[];
}

export type ProfileSectionSlug =
  | "basic"
  | "religious"
  | "professional"
  | "family"
  | "interests"
  | "habits"
  | "partner-preferences"
  | "photos"
  | "voice";

export const DRAFT_KEY_TO_SECTION: Record<string, ProfileSectionSlug> = {
  mn_basic_details_draft: "basic",
  mn_religious_info_draft: "religious",
  mn_professional_info_draft: "professional",
  mn_family_details_draft: "family",
  mn_interests_draft: "interests",
  mn_habits_draft: "habits",
  mn_partner_preferences_draft: "partner-preferences",
  mn_profile_photos_draft: "photos",
  mn_voice_intro_draft: "voice",
};

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getUserIdFromToken(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ? Number(payload.userId) : null;
  } catch {
    return null;
  }
}

async function parseJson(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const preview = (await res.text()).slice(0, 120);
    if (res.status === 404) {
      throw new Error(
        "Profile API endpoint not found. Deploy the latest API or set NEXT_PUBLIC_API_URL to your local server (http://localhost:3333)."
      );
    }
    throw new Error(`Expected JSON but received ${res.status}: ${preview}`);
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function fetchProfileCompletion(userId?: number): Promise<ProfileCompletionResult> {
  const id = userId ?? getUserIdFromToken();
  if (!id) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/user/${id}/profile/completion`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJson(res);
  return data.profileCompletion;
}

export async function fetchProfileSection(
  section: ProfileSectionSlug,
  userId?: number
): Promise<{ section: string; draftKey: string; data: Record<string, unknown> }> {
  const id = userId ?? getUserIdFromToken();
  if (!id) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/user/${id}/profile/sections/${section}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return parseJson(res);
}

export async function updateProfileSection(
  section: ProfileSectionSlug,
  data: Record<string, unknown>,
  userId?: number
): Promise<{
  user: Record<string, unknown>;
  profileCompletion: ProfileCompletionResult;
  draftKey: string;
  data: Record<string, unknown>;
}> {
  const id = userId ?? getUserIdFromToken();
  if (!id) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/user/${id}/profile/sections/${section}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ data }),
  });
  const result = await parseJson(res);

  // Keep localStorage in sync for profile-builder wizard
  if (result.draftKey && result.data) {
    localStorage.setItem(result.draftKey, JSON.stringify(result.data));
  }

  return result;
}

export async function updateUserCoreFields(
  coreFields: Record<string, unknown>,
  userId?: number
): Promise<{ user: Record<string, unknown>; profileCompletion?: ProfileCompletionResult }> {
  const id = userId ?? getUserIdFromToken();
  if (!id) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/user/${id}/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ core_fields: coreFields }),
  });
  return parseJson(res);
}

export async function updateProfileSectionByDraftKey(
  draftKey: string,
  data: Record<string, unknown>,
  userId?: number
) {
  const section = DRAFT_KEY_TO_SECTION[draftKey];
  if (!section) {
    throw new Error(`No section mapping for draft key: ${draftKey}`);
  }
  return updateProfileSection(section, data, userId);
}

export function strengthStyles(strength: ProfileCompletionResult["strength"]) {
  switch (strength) {
    case "Excellent":
      return {
        label: "Excellent",
        text: "text-emerald-200 bg-emerald-950/40 border-emerald-800/30",
        bar: "bg-gradient-to-r from-emerald-400 to-teal-400",
      };
    case "Strong":
      return {
        label: "Strong",
        text: "text-teal-200 bg-teal-950/40 border-teal-800/30",
        bar: "bg-gradient-to-r from-[#81c4bd] to-[#026d77]",
      };
    case "Average":
      return {
        label: "Average",
        text: "text-amber-200 bg-amber-950/40 border-amber-800/30",
        bar: "bg-gradient-to-r from-amber-400 to-amber-300",
      };
    default:
      return {
        label: "Weak",
        text: "text-rose-200 bg-rose-950/40 border-rose-800/30",
        bar: "bg-gradient-to-r from-rose-400 to-rose-500",
      };
  }
}
