"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  Sparkles,
  RefreshCw,
  User,
  PhoneCall,
  Calendar,
  MessageSquare,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { getEnrichedProfile } from "@/lib/profile-utils";
import { User as UserType } from "@/types";

const CALL_STATUS_OPTIONS = [
  { id: "NOT_CALLED", label: "Not Called" },
  { id: "CALLED", label: "Called (General)" },
  { id: "INTERESTED", label: "Interested" },
  { id: "NOT_INTERESTED", label: "Not Interested" },
  { id: "FOLLOW_UP", label: "Follow-Up Required" },
  { id: "NO_ANSWER", label: "No Answer / Busy" },
];

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

function callBadgeClass(status?: string | null) {
  const s = status || "NOT_CALLED";
  const map: Record<string, string> = {
    NOT_CALLED: "bg-gray-100 text-gray-600",
    CALLED: "bg-blue-100 text-blue-800",
    INTERESTED: "bg-emerald-100 text-emerald-800",
    NOT_INTERESTED: "bg-rose-100 text-rose-800",
    FOLLOW_UP: "bg-purple-100 text-purple-800",
    NO_ANSWER: "bg-amber-100 text-amber-800",
  };
  return map[s] || "bg-gray-100 text-gray-600";
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id, 10);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Call Tracking Modal State
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callStatusInput, setCallStatusInput] = useState<string>("NOT_CALLED");
  const [calledDateInput, setCalledDateInput] = useState<string>("");
  const [callResponseInput, setCallResponseInput] = useState<string>("");
  const [savingCallLog, setSavingCallLog] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProfile = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(user.id);
      triggerAlert(`Profile ${user.profileId || `MN-${100000 + user.id}`} deleted permanently.`);
      setTimeout(() => {
        router.push("/admin/users");
      }, 1200);
    } catch (err: any) {
      triggerAlert(err?.message || "Failed to delete user.", "error");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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

  const openCallModal = () => {
    if (!user) return;
    setCallStatusInput(user.call_status || "NOT_CALLED");
    setCalledDateInput(
      user.called_date
        ? new Date(user.called_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setCallResponseInput(user.call_response || "");
    setCallModalOpen(true);
  };

  const handleSaveCallLog = async () => {
    if (!user) return;
    setSavingCallLog(true);
    try {
      await adminApi.updateCallLog(user.id, {
        call_status: callStatusInput,
        called_date: calledDateInput,
        call_response: callResponseInput,
      });
      triggerAlert("Call log recorded successfully! 📞");
      setCallModalOpen(false);
      await loadUser();
    } catch (err: any) {
      triggerAlert(err?.message || "Failed to update call log.", "error");
    } finally {
      setSavingCallLog(false);
    }
  };

  // Manual KYC Verification State
  const [manualVerifyOpen, setManualVerifyOpen] = useState(false);
  const [manualDocType, setManualDocType] = useState("Aadhaar Card (Offline / WhatsApp)");
  const [manualNotes, setManualNotes] = useState("");
  const [savingManualVerify, setSavingManualVerify] = useState(false);

  const handleManualVerify = async () => {
    if (!user) return;
    setSavingManualVerify(true);
    try {
      const res = await adminApi.manualVerifyKyc(user.id, {
        document_type: manualDocType,
        notes: manualNotes,
      });
      triggerAlert(res.message || "Profile manually verified successfully! ✅");
      setManualVerifyOpen(false);
      await loadUser();
    } catch (err: any) {
      triggerAlert(err?.message || "Failed to verify profile.", "error");
    } finally {
      setSavingManualVerify(false);
    }
  };

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
            {user.profileId || `MN-${100000 + user.id}`} · {user.mobile_number}
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
        description="Full account details, matrimony data, and call tracking notes."
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
          <span className="text-gray-400 font-bold uppercase text-[9px]">Call Status</span>
          <p className="mt-1">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${callBadgeClass(user.call_status)}`}>
              {(user.call_status || "NOT_CALLED").replace("_", " ")}
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
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={openCallModal}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
        >
          <PhoneCall className="w-3.5 h-3.5" /> Record / Edit Call Log
        </button>
        {user.kyc_status !== "VERIFIED" && (
          <button
            type="button"
            onClick={() => setManualVerifyOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Manual Verify ID
          </button>
        )}

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
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Profile
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Admin Call Tracking & Feedback">
          <Field label="Call Status" value={(user.call_status || "NOT_CALLED").replace("_", " ")} />
          <Field label="Called Date" value={formatDate(user.called_date)} />
          <div className="pt-2">
            <span className="text-gray-500 text-xs font-medium">Last Customer Response / Remarks:</span>
            <div className="mt-1 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800 italic">
              {user.call_response ? `"${user.call_response}"` : "No response logged yet."}
            </div>
          </div>
        </Section>

        <Section title="Account Information">
          <Field label="Profile ID" value={user.profileId || `MN-${100000 + user.id}`} />
          <Field label="Internal ID" value={user.id} />
          <Field label="UUID" value={user.uuid} />
          <Field label="Profile created for" value={user.profile_for} />
          <Field label="Full name" value={`${user.first_name} ${user.last_name}`.trim()} />
          <Field label="Gender" value={user.gender} />
          <Field label="Date of birth" value={formatDate(user.dob)} />
          <Field label="Age" value={ageFromDob ?? profile.age} />
          <Field label="Caste / Community" value={user.cast} />
          <Field label="Location (Place)" value={user.location} />
          <Field label="Email" value={user.email} />
          <Field label="Mobile" value={user.mobile_number} />
          <Field label="Registered" value={formatDateTime(user.created_at)} />
          <Field label="Last updated" value={formatDateTime(user.updated_at)} />
          <Field label="Last login" value={formatDateTime(user.last_login)} />
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

        <Section title="ID Verification">
          {((user.profile_details as any)?.manual_verification) && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-1 mb-2">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified Manually by Support Admin
              </div>
              <p className="text-[11px] text-emerald-700">
                <strong>Admin:</strong> {(user.profile_details as any).manual_verification.admin_name || "Support Admin"} · <strong>Type:</strong> {(user.profile_details as any).manual_verification.document_type}
              </p>
              {(user.profile_details as any).manual_verification.notes && (
                <p className="text-[11px] text-emerald-800 italic bg-emerald-100/60 p-1.5 rounded-lg">
                  "{(user.profile_details as any).manual_verification.notes}"
                </p>
              )}
            </div>
          )}

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
          </div>

          {user.kyc_status !== "VERIFIED" && (
            <div className="pt-3 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={() => setManualVerifyOpen(true)}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Verify ID Manually (Offline / WhatsApp Submission)
              </button>
            </div>
          )}
        </Section>
      </div>

      {/* Manual Verification Modal */}
      {manualVerifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Manual ID Verification: {user.first_name} {user.last_name}
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  {user.profileId || `MN-${100000 + user.id}`} · Mobile: {user.mobile_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setManualVerifyOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              Use this when a member has sent their identity proof directly to the support team (via WhatsApp, email, or in-person) without uploading on the website.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Verified Document Type
                </label>
                <select
                  value={manualDocType}
                  onChange={(e) => setManualDocType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="Aadhaar Card (Offline / WhatsApp)">Aadhaar Card (Offline / WhatsApp)</option>
                  <option value="Passport (Offline / WhatsApp)">Passport (Offline / WhatsApp)</option>
                  <option value="Voter ID (Offline / WhatsApp)">Voter ID (Offline / WhatsApp)</option>
                  <option value="Driving License (Offline / Support)">Driving License (Offline / Support)</option>
                  <option value="Government ID (Direct Support Check)">Government ID (Direct Support Check)</option>
                  <option value="Personal / Family Reference Verified">Personal / Family Reference Verified</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Support Admin Remarks / Notes
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g., Member provided Aadhaar photo via support WhatsApp. Document verified by support team."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setManualVerifyOpen(false)}
                disabled={savingManualVerify}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualVerify}
                disabled={savingManualVerify}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {savingManualVerify ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Mark Verified in DB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Call Log Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-brand-600" />
                  Record Call Log: {user.first_name} {user.last_name}
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  {user.profileId || `MN-${100000 + user.id}`} · Mobile: {user.mobile_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCallModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Call Status Option
                </label>
                <select
                  value={callStatusInput}
                  onChange={(e) => setCallStatusInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {CALL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Called Date
                </label>
                <input
                  type="date"
                  value={calledDateInput}
                  onChange={(e) => setCalledDateInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Customer Response / Call Notes</span>
                  <MessageSquare className="w-3 h-3 text-gray-400" />
                </label>
                <textarea
                  rows={4}
                  value={callResponseInput}
                  onChange={(e) => setCallResponseInput(e.target.value)}
                  placeholder="Type what customer said last during the call..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSaveCallLog}
                disabled={savingCallLog}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingCallLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Call Log
              </button>
              <button
                type="button"
                onClick={() => setCallModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && user && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-gray-150 shadow-2xl">
            <div className="flex items-center gap-3 text-red-650">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-950 text-sm">Delete Member Profile Permanently?</h3>
                <p className="text-xs text-gray-400">Profile ID: {user.profileId || `MN-${100000 + user.id}`}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900">{user.first_name} {user.last_name}</strong>?
              This action will completely remove all their profile details, KYC documents, messages, chats, interests, and matching records.
            </p>

            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-[11px] text-red-800 font-medium">
              ⚠️ Warning: This administrative action is irreversible.
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProfile}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
