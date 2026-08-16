"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Check, X, Sparkles, RefreshCw, User,
} from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { getEnrichedProfile } from "@/lib/profile-utils";
import { User as UserType } from "@/types";

function normalizeProfileDetails(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function getDraft<T extends Record<string, unknown>>(details: Record<string, unknown>, key: string): T {
  const val = details[key];
  if (!val) return {} as T;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return {} as T;
    }
  }
  return val as T;
}

function photoSrc(photo: { dataUrl?: string; url?: string }) {
  return photo.dataUrl || photo.url || "";
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2 bg-white">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  const display =
    value === null || value === undefined || value === ""
      ? "Not set"
      : String(value);
  const empty = display === "Not set";

  return (
    <div className="flex justify-between gap-4 text-xs py-0.5">
      <span className="text-gray-500 font-medium shrink-0">{label}</span>
      <span className={`font-semibold text-right ${empty ? "text-gray-300 italic" : "text-gray-900"}`}>
        {display}
      </span>
    </div>
  );
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    in_active: "bg-amber-100 text-amber-800",
    suspended: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}

function kycBadgeClass(status: string) {
  const map: Record<string, string> = {
    VERIFIED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-amber-100 text-amber-800",
    REJECTED: "bg-red-100 text-red-800",
    NOT_SUBMITTED: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = parseInt(params.id as string, 10);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUser(userId);
      setUser(res.user);
    } catch {
      triggerAlert("Failed to load user.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(userId)) loadUser();
  }, [userId]);

  const handleStatus = async (action: "activate" | "deactivate" | "suspend" | "restore") => {
    try {
      const res = await adminApi.updateUserStatus(userId, action);
      triggerAlert(res.message);
      await loadUser();
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : "Action failed.", "error");
    }
  };

  const handleTogglePremium = async () => {
    try {
      const res = await adminApi.togglePremium(userId);
      triggerAlert(res.message);
      await loadUser();
    } catch {
      triggerAlert("Failed to update premium status.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 text-sm">User not found.</p>
        <Link href="/admin/users" className="text-brand-600 text-xs mt-2 inline-block">
          Back to users
        </Link>
      </div>
    );
  }

  const details = normalizeProfileDetails(user.profile_details);
  const photosDraft = getDraft<{ photos?: Array<{ dataUrl?: string; url?: string; isPrimary?: boolean }> }>(
    details,
    "mn_profile_photos_draft"
  );
  const videoDraft = getDraft<{ video?: { dataUrl?: string; url?: string } }>(details, "mn_video_intro_draft");
  const voiceDraft = getDraft<{ voice?: { dataUrl?: string; url?: string } }>(details, "mn_voice_intro_draft");

  const photos = (photosDraft.photos || [])
    .map(photoSrc)
    .filter(Boolean);

  const videoUrl = videoDraft.video?.dataUrl || videoDraft.video?.url;
  const voiceUrl = voiceDraft.voice?.dataUrl || voiceDraft.voice?.url;

  const profile = getEnrichedProfile(user as unknown as UserType);
  const ageFromDob = user.dob
    ? Math.floor((Date.now() - new Date(user.dob).getTime()) / 31557600000)
    : null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <AdminAlert alert={alert} />

      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/users"
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-xs text-gray-500 truncate">
            {user.profileId} · {user.mobile_number}
          </p>
        </div>
        <button
          type="button"
          onClick={loadUser}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <AdminPageHeader
        title="Member Profile Review"
        description="Full account and matrimony profile data for admin review."
        icon={User}
      />

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-3 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[9px]">Account</span>
          <p className="mt-1">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadgeClass(user.status)}`}>
              {user.status.replace("_", " ")}
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[9px]">KYC</span>
          <p className="mt-1">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${kycBadgeClass(user.kyc_status)}`}>
              {user.kyc_status.replace("_", " ")}
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[9px]">Profile completion</span>
          <p className="font-bold text-brand-600 mt-1">
            {user.profileCompletion?.percentage ?? 0}%
            <span className="text-gray-400 font-normal text-[10px] ml-1">
              ({user.profileCompletion?.completedSteps ?? 0}/{user.profileCompletion?.totalSteps ?? 11} steps)
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl border p-3 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[9px]">Premium</span>
          <p className="font-bold text-gray-900 mt-1">{user.is_premium ? "Premium member" : "Free member"}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {user.status !== "active" && (
          <button
            type="button"
            onClick={() => handleStatus("activate")}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Activate
          </button>
        )}
        {user.status === "active" && (
          <button
            type="button"
            onClick={() => handleStatus("deactivate")}
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg"
          >
            Deactivate
          </button>
        )}
        {user.status !== "suspended" && (
          <button
            type="button"
            onClick={() => handleStatus("suspend")}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Suspend
          </button>
        )}
        {(user.status === "suspended" || user.status === "in_active") && (
          <button
            type="button"
            onClick={() => handleStatus("restore")}
            className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg"
          >
            Restore
          </button>
        )}
        <button
          type="button"
          onClick={handleTogglePremium}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
            user.is_premium
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          {user.is_premium ? "Remove Premium" : "Grant Premium"}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Account Information">
          <Field label="Profile ID" value={user.profileId} />
          <Field label="Internal ID" value={user.id} />
          <Field label="UUID" value={user.uuid} />
          <Field label="Profile created for" value={user.profile_for} />
          <Field label="Full name" value={`${user.first_name} ${user.last_name}`.trim()} />
          <Field label="Gender" value={user.gender} />
          <Field label="Date of birth" value={formatDate(user.dob)} />
          <Field label="Age" value={ageFromDob ?? profile.age} />
          <Field label="Caste / Community" value={user.cast} />
          <Field label="Location" value={user.location} />
          <Field label="Email" value={user.email} />
          <Field label="Mobile" value={user.mobile_number} />
          <Field label="Registered" value={formatDateTime(user.created_at)} />
          <Field label="Last updated" value={formatDateTime(user.updated_at)} />
          <Field label="Last login" value={formatDateTime(user.last_login)} />
          <Field label="Referral code" value={user.referral_code} />
          <Field label="Referral points" value={user.referral_points} />
          <Field label="New user flag" value={user.is_new_user ? "Yes" : "No"} />
        </Section>

        <Section title="Basic Details">
          <Field label="Name" value={profile.name} />
          <Field label="Gender" value={profile.gender} />
          <Field label="Age" value={profile.age} />
          <Field label="Height" value={profile.height} />
          <Field label="Weight" value={profile.weight} />
          <Field label="Marital status" value={profile.maritalStatus} />
          <Field label="Mother tongue" value={profile.motherTongue} />
          <Field label="Present location" value={profile.presentLocation} />
          <Field label="Physical status" value={profile.physicalStatus} />
          <Field label="Languages spoken" value={profile.languagesSpoken} />
          <Field label="Marriage goal" value={profile.marriageGoalPlan} />
          <Field label="Relocate for partner" value={profile.relocateForPartner} />
          <Field label="About me" value={profile.aboutMe} />
        </Section>

        <Section title="Religious Information">
          <Field label="Religion" value={profile.religion} />
          <Field label="Community" value={profile.community} />
          <Field label="Religiousness" value={profile.religiousness} />
          <Field label="Namaz" value={profile.namaz} />
          <Field label="Quran reading" value={profile.quranReading} />
        </Section>

        <Section title="Professional Information">
          <Field label="Education" value={profile.education} />
          <Field label="Institution" value={profile.educationalInstitution} />
          <Field label="Profession" value={profile.profession} />
          <Field label="Profession type" value={profile.professionType} />
          <Field label="Company" value={profile.companyName} />
          <Field label="Annual income" value={profile.annualIncome} />
        </Section>

        <Section title="Family Details">
          <Field label="Family type" value={profile.familyType} />
          <Field label="Financial status" value={profile.financialStatus} />
          <Field label="Family values" value={profile.familyValues} />
          <Field label="Father occupation" value={profile.fatherOccupation} />
          <Field label="Mother occupation" value={profile.motherOccupation} />
          <Field label="Siblings" value={profile.siblingsCount} />
        </Section>

        <Section title="Interests & Personality">
          <Field label="Personality / About" value={profile.personalityDescription} />
          <Field
            label="Interests"
            value={profile.interestsList?.length ? profile.interestsList.join(", ") : null}
          />
          <Field
            label="Favourite sports"
            value={profile.favouriteSports?.length ? profile.favouriteSports.join(", ") : null}
          />
          <Field
            label="Favourite places"
            value={profile.favouritePlaces?.length ? profile.favouritePlaces.join(", ") : null}
          />
        </Section>

        <Section title="Habits">
          <Field label="Eating habits" value={profile.eatingHabits} />
          <Field label="Smoking" value={profile.smokingHabits} />
          <Field label="Drinking" value={profile.drinkingHabits} />
        </Section>

        <Section title="Partner Preferences">
          <Field label="About partner" value={profile.aboutPartner} />
          <Field label="Preferred age" value={profile.prefAge} />
          <Field label="Preferred height" value={profile.prefHeight} />
          <Field label="Marital status" value={profile.prefMaritalStatus} />
          <Field label="Religion" value={profile.prefReligion} />
          <Field label="Community" value={profile.prefCommunity} />
          <Field label="Education" value={profile.prefEducation} />
          <Field label="Occupation" value={profile.prefOccupation} />
          <Field label="Locations" value={profile.prefLocations} />
          <Field label="Namaz preference" value={profile.prefNamaz} />
          <Field label="Quran preference" value={profile.prefQuranReading} />
        </Section>

        <Section title="ID Verification">
          <Field label="Status" value={user.kyc_status.replace("_", " ")} />
          <Field label="Document type" value={user.kyc_document_type} />
          <Field label="Submitted" value={formatDateTime(user.kyc_submitted_at)} />
          <Field label="Verified" value={formatDateTime(user.kyc_verified_at)} />
          <Field label="Rejection reason" value={user.kyc_rejected_reason} />
          <div className="flex flex-wrap gap-3 pt-2">
            {user.kyc_front_url && (
              <a
                href={user.kyc_front_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                View front document
              </a>
            )}
            {user.kyc_back_url && (
              <a
                href={user.kyc_back_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                View back document
              </a>
            )}
            {!user.kyc_front_url && !user.kyc_back_url && (
              <span className="text-xs text-gray-300 italic">No documents uploaded</span>
            )}
          </div>
        </Section>

        <Section title="Profile Photos">
          {photos.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {photos.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-100"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-300 italic">No photos uploaded</p>
          )}
        </Section>

        {(videoUrl || voiceUrl) && (
          <Section title="Media Introduction">
            {videoUrl && (
              <video src={videoUrl} controls className="w-full max-h-48 rounded-lg border border-gray-100" />
            )}
            {voiceUrl && (
              <audio src={voiceUrl} controls className="w-full mt-2" />
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
