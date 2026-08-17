"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, X, Check, Sparkles } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

function resolveDocUrl(url: string | null): string {
  if (!url) return "";
  if (url.includes("localhost:")) {
    const relativePath = url.substring(url.indexOf("/user/kyc/document"));
    return `${API_URL}${relativePath}`;
  }
  return url;
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
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 4000);
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

  const approve = async (id: number) => {
    try {
      await adminApi.kycApprove(id);
      triggerAlert("Identity verification approved.");
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
          <input
            type="text"
            placeholder="Search by member name, phone, or Profile ID (MN-100001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
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
                      <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
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
                      <div className="p-2 flex items-center justify-center bg-white min-h-[160px]">
                        <img
                          src={resolveDocUrl(selected.kyc_front_url)}
                          alt="Front ID Document"
                          className="w-full max-h-52 object-contain rounded"
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
                      <div className="p-2 flex items-center justify-center bg-white min-h-[160px]">
                        <img
                          src={resolveDocUrl(selected.kyc_back_url)}
                          alt="Back ID Document"
                          className="w-full max-h-52 object-contain rounded"
                        />
                      </div>
                    </div>
                  )}
                  {!selected.kyc_front_url && !selected.kyc_back_url && (
                    <div className="col-span-2 py-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No document files uploaded for this user.
                    </div>
                  )}
                </div>

                {selected.kyc_status !== "VERIFIED" && selected.kyc_status !== "REJECTED" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => approve(selected.id)}
                      className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200"
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
    </div>
  );
}
