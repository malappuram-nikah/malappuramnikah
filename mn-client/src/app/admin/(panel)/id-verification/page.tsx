"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, X, Check, Sparkles, Trash2, Loader2, Search, UserPlus, CheckCircle2 } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

function resolveDocUrl(url: string | null): string {
  if (!url) return "";
  const token = typeof window !== "undefined"
    ? (localStorage.getItem("mn_admin_token") || localStorage.getItem("mn_token"))
    : "";
  let fullUrl = url;
  if (url.includes("localhost:")) {
    const relativePath = url.substring(url.indexOf("/user/kyc/document"));
    fullUrl = `${API_URL}${relativePath}`;
  } else if (!url.startsWith("http")) {
    const cleanPath = url.replace(/^\/?(api\/)?(user\/kyc\/document\/)?/, "");
    fullUrl = `${API_URL}/user/kyc/document/${cleanPath}`;
  }
  if (token && !fullUrl.includes("token=")) {
    fullUrl += (fullUrl.includes("?") ? "&" : "?") + `token=${encodeURIComponent(token)}`;
  }
  return fullUrl;
}

const STATUS_OPTIONS = [
  { id: "ALL", label: "All Status" },
  { id: "PENDING", label: "Pending" },
  { id: "UNDER_REVIEW", label: "Under Review" },
  { id: "VERIFIED", label: "Verified" },
  { id: "REJECTED", label: "Rejected" },
] as const;

const GENDER_OPTIONS = [
  { id: "ALL", label: "All Genders" },
  { id: "Male", label: "Male ♂" },
  { id: "Female", label: "Female ♀" },
] as const;

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0,
  UNDER_REVIEW: 1,
  REJECTED: 2,
  VERIFIED: 3,
};

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-blue-100 text-blue-800 border-blue-200",
    UNDER_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
    VERIFIED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };
  return map[status] || "bg-gray-100 text-gray-700 border-gray-200";
}

function FilterBoxes({
  options,
  value,
  onChange,
  counts,
}: {
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-xl border transition-all",
            value === opt.id
              ? "bg-brand-600 text-white border-brand-600 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700"
          )}
        >
          {opt.label}
          {counts && counts[opt.id] !== undefined ? (
            <span className={cn("ml-1.5", value === opt.id ? "text-white/80" : "text-gray-400")}>
              ({counts[opt.id]})
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export default function AdminIdVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Direct Manual KYC State (Verify Without Upload)
  const [showDirectVerifyModal, setShowDirectVerifyModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<AdminUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserToVerify, setSelectedUserToVerify] = useState<AdminUser | null>(null);
  const [directDocType, setDirectDocType] = useState("Aadhaar Card (Offline / WhatsApp)");
  const [directNotes, setDirectNotes] = useState("");
  const [savingDirectVerify, setSavingDirectVerify] = useState(false);

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSearchMembers = async (q: string) => {
    setUserSearchQuery(q);
    if (!q.trim() || q.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await adminApi.getUsers({ search: q.trim(), limit: 8 });
      setUserSearchResults(res.users);
    } catch {
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleDirectManualVerify = async () => {
    if (!selectedUserToVerify) return;
    setSavingDirectVerify(true);
    try {
      const res = await adminApi.manualVerifyKyc(selectedUserToVerify.id, {
        document_type: directDocType,
        notes: directNotes,
      });
      triggerAlert(res.message || "Member marked as VERIFIED in database! ✅");
      setShowDirectVerifyModal(false);
      setSelectedUserToVerify(null);
      setUserSearchQuery("");
      setUserSearchResults([]);
      setDirectNotes("");
      await loadRequests();
    } catch (err: any) {
      triggerAlert(err?.message || "Failed to verify member.", "error");
    } finally {
      setSavingDirectVerify(false);
    }
  };

  const handlePurgeLegacy = async () => {
    setIsPurging(true);
    try {
      const res = await adminApi.purgeLegacyVerifiedKyc();
      triggerAlert(res.message || "Successfully purged verified ID proofs.", "success");
      setShowPurgeModal(false);
      await loadRequests();
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : "Purge failed.", "error");
    } finally {
      setIsPurging(false);
    }
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: { search?: string; gender?: string } = {};
      if (search.trim()) params.search = search.trim();
      if (genderFilter !== "ALL") params.gender = genderFilter;
      const res = await adminApi.getKycRequests(params);
      setRequests(res.requests);
    } catch {
      triggerAlert("Failed to load KYC requests.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, genderFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const statusCounts = useMemo(() => {
    const q = search.toLowerCase();
    const base = requests.filter((r) => {
      if (genderFilter !== "ALL" && (r.gender || "Male").toLowerCase() !== genderFilter.toLowerCase()) return false;
      if (!q) return true;
      const name = `${r.first_name} ${r.last_name}`.toLowerCase();
      const profId = (r.profileId || `mn-${100000 + r.id}`).toLowerCase();
      return name.includes(q) || r.mobile_number.includes(q) || profId.includes(q);
    });
    const counts: Record<string, number> = { ALL: base.length };
    for (const req of base) {
      counts[req.kyc_status] = (counts[req.kyc_status] || 0) + 1;
    }
    return counts;
  }, [requests, search, genderFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests
      .filter((r) => {
        if (statusFilter !== "ALL" && r.kyc_status !== statusFilter) return false;
        if (genderFilter !== "ALL" && (r.gender || "Male").toLowerCase() !== genderFilter.toLowerCase()) return false;
        if (!q) return true;
        const name = `${r.first_name} ${r.last_name}`.toLowerCase();
        const profId = (r.profileId || `mn-${100000 + r.id}`).toLowerCase();
        return name.includes(q) || r.mobile_number.includes(q) || profId.includes(q);
      })
      .sort((a, b) => {
        const pa = STATUS_PRIORITY[a.kyc_status] ?? 99;
        const pb = STATUS_PRIORITY[b.kyc_status] ?? 99;
        if (pa !== pb) return pa - pb;
        const aTime = a.kyc_submitted_at ? new Date(a.kyc_submitted_at).getTime() : 0;
        const bTime = b.kyc_submitted_at ? new Date(b.kyc_submitted_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [requests, statusFilter, search]);

  const selectRequest = async (req: AdminUser) => {
    setSelected(req);
    if (req.kyc_status === "PENDING") {
      try {
        await adminApi.kycReview(req.id);
        setSelected({ ...req, kyc_status: "UNDER_REVIEW" });
        await loadRequests();
      } catch {
        /* non-blocking */
      }
    }
  };

  const approve = async (id: number, grantPremium: boolean = false) => {
    try {
      await adminApi.kycApprove(id, grantPremium);
      triggerAlert(grantPremium ? "Identity verification approved & Premium activated!" : "Identity verification approved.");
      setSelected(null);
      await loadRequests();
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : "Approval failed.", "error");
    }
  };

  const reject = async (id: number) => {
    if (!rejectReason.trim()) {
      triggerAlert("Rejection reason is required.", "error");
      return;
    }
    try {
      await adminApi.kycReject(id, rejectReason);
      triggerAlert("Request rejected.");
      setShowRejectModal(false);
      setRejectReason("");
      setSelected(null);
      await loadRequests();
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : "Rejection failed.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <AdminAlert alert={alert} />
      <AdminPageHeader
        title="Identity KYC Verification"
        description="Review uploaded ID proof documents and manage member verification statuses."
        icon={ShieldCheck}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="space-y-3 border-b border-gray-100 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search by member name, phone, or Profile ID (MN-100001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedUserToVerify(null);
                setUserSearchQuery("");
                setUserSearchResults([]);
                setDirectNotes("");
                setShowDirectVerifyModal(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Direct Verify (No Upload)
            </button>
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition-colors shrink-0"
              title="Purge legacy ID documents for already-verified members in compliance with DPDP Act 2023"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-700" />
              Purge Verified ID Cards (DPDP Act)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Verification status</p>
              <FilterBoxes
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
                counts={statusCounts}
              />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Gender</p>
              <FilterBoxes
                options={GENDER_OPTIONS}
                value={genderFilter}
                onChange={setGenderFilter}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Sparkles className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className={`${selected ? "lg:col-span-5" : "lg:col-span-12"} max-h-[600px] overflow-y-auto`}>
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No verification requests found for this filter.</div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
                        <th className="p-3">#</th>
                        <th className="p-3">Member</th>
                        <th className="p-3">Profile ID</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Document</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((req, index) => (
                        <tr
                          key={req.id}
                          onClick={() => selectRequest(req)}
                          className={cn(
                            "border-b border-gray-50 cursor-pointer transition-colors",
                            selected?.id === req.id
                              ? "bg-blue-50/40"
                              : "hover:bg-gray-50/80",
                            req.kyc_status === "PENDING" && selected?.id !== req.id && "bg-blue-50/20"
                          )}
                        >
                          <td className="p-3 font-bold text-gray-400">{index + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-gray-900">{req.first_name} {req.last_name}</p>
                            <p className="text-[10px] text-gray-500">{req.mobile_number}</p>
                          </td>
                          <td className="p-3 font-mono text-[11px] font-semibold text-brand-700">
                            {req.profileId || `MN-${100000 + req.id}`}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${req.gender?.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {req.gender || 'Male'}
                            </span>
                          </td>
                          <td className="p-3 text-[10px] text-gray-600 font-medium">
                            {req.kyc_document_type || "Document"}
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border",
                              statusBadgeClass(req.kyc_status)
                            )}>
                              {req.kyc_status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[10px] text-gray-400 font-semibold mt-2">{filtered.length} request(s) listed</p>
            </div>

            {selected && (
              <div className="lg:col-span-7 border border-gray-100 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{selected.first_name} {selected.last_name}</h3>
                      <span className="font-mono text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                        {selected.profileId || `MN-${100000 + selected.id}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {selected.mobile_number} ·{" "}
                      <Link href={`/admin/users/${selected.id}`} className="text-brand-600 hover:underline font-semibold">
                        View full user profile →
                      </Link>
                    </p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Document Type</span>
                    <span className="font-semibold text-gray-800">{selected.kyc_document_type || "ID Proof"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block text-right">Verification Status</span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border inline-block mt-0.5",
                      statusBadgeClass(selected.kyc_status)
                    )}>
                      {selected.kyc_status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {selected.kyc_front_url && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <div className="bg-gray-100 px-3 py-1.5 text-[9px] font-bold text-gray-600 flex justify-between items-center">
                        <span>Front Side</span>
                        <a
                          href={resolveDocUrl(selected.kyc_front_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline text-[9px] font-bold"
                        >
                          Open Original ↗
                        </a>
                      </div>
                      <div className="p-3 flex items-center justify-center bg-gray-50/50 min-h-[180px] relative">
                        <img
                          src={resolveDocUrl(selected.kyc_front_url)}
                          alt="Front ID Document"
                          className="w-full max-h-56 object-contain rounded bg-white shadow-xs border border-gray-150"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                  {selected.kyc_back_url && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <div className="bg-gray-100 px-3 py-1.5 text-[9px] font-bold text-gray-600 flex justify-between items-center">
                        <span>Back Side</span>
                        <a
                          href={resolveDocUrl(selected.kyc_back_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline text-[9px] font-bold"
                        >
                          Open Original ↗
                        </a>
                      </div>
                      <div className="p-3 flex items-center justify-center bg-gray-50/50 min-h-[180px] relative">
                        <img
                          src={resolveDocUrl(selected.kyc_back_url)}
                          alt="Back ID Document"
                          className="w-full max-h-56 object-contain rounded bg-white shadow-xs border border-gray-150"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                  {!selected.kyc_front_url && !selected.kyc_back_url && (
                    <div className="col-span-2 py-8 px-4 text-center text-xs rounded-xl border border-dashed bg-emerald-50/60 border-emerald-200 text-emerald-800 space-y-1">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {selected.kyc_status === "VERIFIED" ? "ID Document Purged (DPDP Act Compliant)" : "No ID Document Files"}
                      </div>
                      <p className="text-[11px] text-emerald-700 max-w-sm mx-auto">
                        {selected.kyc_status === "VERIFIED"
                          ? "In adherence to India's DPDP Act 2023 data minimisation rules, sensitive Government ID proof images are permanently deleted upon admin verification."
                          : "No document files are currently on record for this member."}
                      </p>
                    </div>
                  )}
                </div>

                {selected.kyc_status !== "VERIFIED" && selected.kyc_status !== "REJECTED" && (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => approve(selected.id, false)}
                      className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve ID
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(selected.id, true)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Approve & Enable Premium ⭐
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Manual Verification Modal */}
      {showDirectVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-4 border border-gray-150 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Direct Profile Verification</h3>
                  <p className="text-[11px] text-gray-500">Verify a member without requiring a website upload</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectVerifyModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              Use this when a registered member sends their ID proof (Aadhaar / Passport / Voter ID) personally to the support admin team via WhatsApp, call, or email.
            </div>

            {/* Member Search */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                1. Select Member to Verify
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type name, phone (+91...), or MN-100001..."
                  value={userSearchQuery}
                  onChange={(e) => handleSearchMembers(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {searchingUsers && (
                  <Loader2 className="w-4 h-4 text-brand-500 animate-spin absolute right-3 top-3" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {userSearchResults.length > 0 && !selectedUserToVerify && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 shadow-lg">
                  {userSearchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserToVerify(u);
                        setUserSearchQuery(`${u.first_name} ${u.last_name} (${u.profileId || `MN-${100000 + u.id}`})`);
                      }}
                      className="w-full text-left p-2.5 hover:bg-blue-50/60 flex items-center justify-between transition-colors text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{u.first_name} {u.last_name}</span>
                        <span className="text-[10px] text-gray-500 ml-2">{u.mobile_number}</span>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                        {u.profileId || `MN-${100000 + u.id}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected User Badge */}
              {selectedUserToVerify && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {selectedUserToVerify.first_name} {selectedUserToVerify.last_name}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {selectedUserToVerify.profileId || `MN-${100000 + selectedUserToVerify.id}`} · {selectedUserToVerify.mobile_number}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserToVerify(null);
                      setUserSearchQuery("");
                    }}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Document Type & Notes */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  2. Document Verification Method
                </label>
                <select
                  value={directDocType}
                  onChange={(e) => setDirectDocType(e.target.value)}
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
                  3. Support Admin Notes
                </label>
                <textarea
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  placeholder="e.g., ID proof verified directly via WhatsApp support chat on 25 Aug 2026."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDirectVerifyModal(false)}
                disabled={savingDirectVerify}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDirectManualVerify}
                disabled={savingDirectVerify || !selectedUserToVerify}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingDirectVerify ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Confirm & Mark Verified
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-gray-900">Reject Verification</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full p-3 text-xs border border-gray-200 rounded-xl"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowRejectModal(false)} className="flex-1 py-2 border rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button type="button" onClick={() => reject(selected.id)} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-4 border border-gray-150 shadow-xl">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 text-amber-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Purge Verified ID Documents</h3>
                <p className="text-xs text-amber-700">Digital Personal Data Protection (DPDP) Act 2023</p>
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <p>
                This operation will find all members who have already been <strong>VERIFIED</strong> and:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <li>Permanently destroy their sensitive Aadhaar / Passport / ID images from <strong>Cloudinary</strong> & local servers.</li>
                <li>Clear stored document URLs in the database to <strong>null</strong>.</li>
                <li><strong>Retain</strong> their Verified status and ID badge without any interruption.</li>
              </ul>
              <p className="text-[11px] text-gray-500 pt-1">
                This action is irreversible and ensures strict compliance with Section 8(5) Data Minimisation rules.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                disabled={isPurging}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeLegacy}
                disabled={isPurging}
                className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                {isPurging ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Purging Storage & DB...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Purge
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
