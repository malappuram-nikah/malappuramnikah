"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Download,
  Loader2,
  PhoneCall,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Calendar,
  MessageSquare,
} from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { exportUsersToPdf, exportUsersToCsv, getUserPlace, getMaritalStatus } from "@/lib/pdf-export";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

const ACCOUNT_STATUS_OPTIONS = [
  { id: "", label: "All Accounts" },
  { id: "active", label: "Active" },
  { id: "new", label: "New (30D)" },
  { id: "in_active", label: "Inactive" },
  { id: "suspended", label: "Suspended" },
];

const GENDER_OPTIONS = [
  { id: "", label: "All Genders" },
  { id: "Male", label: "Male ♂" },
  { id: "Female", label: "Female ♀" },
];

const KYC_STATUS_OPTIONS = [
  { id: "", label: "All KYC" },
  { id: "NOT_SUBMITTED", label: "Not Submitted" },
  { id: "PENDING", label: "Pending" },
  { id: "UNDER_REVIEW", label: "Under Review" },
  { id: "VERIFIED", label: "Verified" },
  { id: "REJECTED", label: "Rejected" },
];

const CALL_STATUS_OPTIONS = [
  { id: "NOT_CALLED", label: "Not Called" },
  { id: "CALLED", label: "Called (General)" },
  { id: "INTERESTED", label: "Interested" },
  { id: "NOT_INTERESTED", label: "Not Interested" },
  { id: "FOLLOW_UP", label: "Follow-Up Required" },
  { id: "NO_ANSWER", label: "No Answer / Busy" },
];

function resolveDocUrl(url: string | null): string {
  if (!url) return "";
  if (url.includes("localhost:")) {
    const relativePath = url.substring(url.indexOf("/user/kyc/document"));
    return `${API_URL}${relativePath}`;
  }
  return url;
}

function getInactiveReason(user: AdminUser): string {
  if (user.status === "active") return "Active Member";
  if (user.status === "suspended") return "Suspended by Admin";
  if (user.last_login) {
    const days = Math.floor((Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 30) return `Inactive (${days} days offline)`;
  }
  const completion = user.profileCompletion?.percentage ?? 0;
  if (completion < 50) return `Inactive (Incomplete: ${completion}%)`;
  return "Deactivated / Inactive";
}

function FilterBoxes({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id || "all"}
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
        </button>
      ))}
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    in_active: "bg-amber-100 text-amber-800",
    suspended: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}

function kycBadge(status: string) {
  const map: Record<string, string> = {
    VERIFIED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-amber-100 text-amber-800",
    REJECTED: "bg-red-100 text-red-800",
    NOT_SUBMITTED: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

function callStatusBadgeClass(status?: string | null) {
  const s = status || "NOT_CALLED";
  const map: Record<string, string> = {
    NOT_CALLED: "bg-gray-100 text-gray-600 border-gray-200",
    CALLED: "bg-blue-50 text-blue-700 border-blue-200",
    INTERESTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NOT_INTERESTED: "bg-rose-50 text-rose-700 border-rose-200",
    FOLLOW_UP: "bg-purple-50 text-purple-700 border-purple-200",
    NO_ANSWER: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return map[s] || "bg-gray-100 text-gray-600 border-gray-200";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState(searchParams.get("gender") || "");
  const [kycFilter, setKycFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals & Export state
  const [docModalUser, setDocModalUser] = useState<AdminUser | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Call Log Modal state
  const [callModalUser, setCallModalUser] = useState<AdminUser | null>(null);
  const [callStatusInput, setCallStatusInput] = useState<string>("NOT_CALLED");
  const [calledDateInput, setCalledDateInput] = useState<string>("");
  const [callResponseInput, setCallResponseInput] = useState<string>("");
  const [savingCallLog, setSavingCallLog] = useState(false);

  const openCallModal = (user: AdminUser) => {
    setCallModalUser(user);
    setCallStatusInput(user.call_status || "NOT_CALLED");
    setCalledDateInput(
      user.called_date
        ? new Date(user.called_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setCallResponseInput(user.call_response || "");
  };

  const handleSaveCallLog = async () => {
    if (!callModalUser) return;
    setSavingCallLog(true);
    try {
      const res = await adminApi.updateCallLog(callModalUser.id, {
        call_status: callStatusInput,
        called_date: calledDateInput,
        call_response: callResponseInput,
      });
      triggerAlert("Call log recorded successfully! 📞");
      setCallModalUser(null);
      await loadUsers();
    } catch (err: any) {
      triggerAlert(err?.message || "Failed to update call log.", "error");
    } finally {
      setSavingCallLog(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100000 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;
      if (kycFilter) params.kyc_status = kycFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await adminApi.getUsers(params);
      const filterObj = ACCOUNT_STATUS_OPTIONS.find((o) => o.id === statusFilter);
      const filterTitle = filterObj?.label || (statusFilter ? statusFilter : "All Accounts");

      exportUsersToPdf(res.users, `${filterTitle} (${res.users.length})`);
      triggerAlert(`PDF Export complete for ${res.users.length} members! 📄`);
    } catch (err) {
      console.error("PDF export error:", err);
      triggerAlert("Failed to generate PDF report.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100000 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;
      if (kycFilter) params.kyc_status = kycFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await adminApi.getUsers(params);
      const filterObj = ACCOUNT_STATUS_OPTIONS.find((o) => o.id === statusFilter);
      const filterTitle = filterObj?.label || (statusFilter ? statusFilter : "All Members");

      exportUsersToCsv(res.users, `${filterTitle} (${res.users.length})`);
      triggerAlert(`CSV Sheet Export complete for ${res.users.length} members! 📊`);
    } catch (err) {
      console.error("CSV export error:", err);
      triggerAlert("Failed to generate CSV sheet report.", "error");
    } finally {
      setDownloadingCsv(false);
    }
  };

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    setGenderFilter(searchParams.get("gender") || "");
  }, [searchParams]);

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;
      if (kycFilter) params.kyc_status = kycFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await adminApi.getUsers(params);
      setUsers(res.users);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error(err);
      triggerAlert("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, genderFilter, kycFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusAction = async (userId: number, action: "activate" | "deactivate" | "suspend" | "restore") => {
    try {
      const res = await adminApi.updateUserStatus(userId, action);
      triggerAlert(res.message);
      await loadUsers();
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : "Action failed.", "error");
    }
  };

  const handleTogglePremium = async (userId: number) => {
    try {
      const res = await adminApi.togglePremium(userId);
      triggerAlert(res.message);
      await loadUsers();
    } catch {
      triggerAlert("Failed to update premium status.", "error");
    }
  };

  const applySearch = () => {
    setPage(1);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <AdminAlert alert={alert} />
      <AdminPageHeader
        title="User Management"
        description="Search, filter, and manage member accounts and call records."
        icon={Users}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="space-y-3 border-b border-gray-100 pb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, phone, location, MN-100001..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Account status</p>
              <FilterBoxes
                options={ACCOUNT_STATUS_OPTIONS}
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
              />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Gender</p>
              <FilterBoxes
                options={GENDER_OPTIONS}
                value={genderFilter}
                onChange={(v) => { setGenderFilter(v); setPage(1); }}
              />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">KYC status</p>
              <FilterBoxes
                options={KYC_STATUS_OPTIONS}
                value={kycFilter}
                onChange={(v) => { setKycFilter(v); setPage(1); }}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center pt-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              title="Registered from"
              className="p-2 text-xs rounded-xl border border-gray-200 bg-gray-50 font-semibold"
            />
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              title="Registered to"
              className="p-2 text-xs rounded-xl border border-gray-200 bg-gray-50 font-semibold"
            />
            <button
              onClick={applySearch}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl"
            >
              Search
            </button>
            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={downloadingCsv}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {downloadingCsv ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> CSV...</>
                ) : (
                  <><FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV Sheet</>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {downloadingPdf ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> PDF...</>
                ) : (
                  <><Download className="w-3.5 h-3.5" /> Download PDF Report</>
                )}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Sparkles className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 font-semibold">
                {total} users found · showing {users.length} per page
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={downloadingCsv}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg transition-colors border border-teal-200"
                >
                  {downloadingCsv ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                  Export CSV Sheet
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors border border-emerald-200"
                >
                  {downloadingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Export PDF Report
                </button>
              </div>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                    <th className="p-3.5 w-10">#</th>
                    <th className="p-3.5">Member Name</th>
                    <th className="p-3.5">Mobile</th>
                    <th className="p-3.5">Place</th>
                    <th className="p-3.5">Marriage Status</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Profile ID</th>
                    <th className="p-3.5">Account / KYC</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5">Call Status & Notes</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3.5 font-bold text-gray-400">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="p-3.5 font-bold text-gray-900">
                        <div>{user.first_name} {user.last_name}</div>
                        {user.email && <div className="text-[10px] text-gray-400 font-normal">{user.email}</div>}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-800 text-xs whitespace-nowrap">
                        📞 {user.mobile_number || "—"}
                      </td>
                      <td className="p-3.5 text-gray-700 font-medium">{getUserPlace(user)}</td>
                      <td className="p-3.5 text-gray-700 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {getMaritalStatus(user)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${user.gender?.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {user.gender || 'Male'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-gray-600 font-medium">
                        {user.profileId || (user.id ? `MN-${100000 + user.id}` : "—")}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge(user.status)}`}>
                            {user.status.replace("_", " ")}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${kycBadge(user.kyc_status)}`}>
                            {user.kyc_status.replace("_", " ")}
                          </span>
                        </div>
                        {user.kyc_front_url && (
                          <button
                            type="button"
                            onClick={() => setDocModalUser(user)}
                            className="mt-1 flex items-center gap-1 text-[9px] font-bold text-brand-600 hover:text-brand-800 hover:underline"
                          >
                            <FileText className="w-3 h-3 text-brand-500" /> View ID
                          </button>
                        )}
                      </td>
                      <td className="p-3.5 text-[10px] text-gray-500 font-medium whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              "inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border",
                              callStatusBadgeClass(user.call_status)
                            )}
                          >
                            {(user.call_status || "NOT_CALLED").replace("_", " ")}
                          </span>
                          {user.called_date && (
                            <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                              {new Date(user.called_date).toLocaleDateString()}
                            </div>
                          )}
                          {user.call_response && (
                            <div className="text-[10px] text-gray-600 italic bg-gray-50 p-1.5 rounded-lg border border-gray-100 line-clamp-2">
                              "{user.call_response}"
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openCallModal(user)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 text-[10px] font-bold"
                            title="Record Call Log"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-blue-600" /> Call Log
                          </button>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {user.status !== "active" ? (
                            <button
                              onClick={() => handleStatusAction(user.id, "activate")}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                              title="Activate User"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusAction(user.id, "deactivate")}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg"
                              title="Deactivate (Set Inactive)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePremium(user.id)}
                            className={`text-[8px] font-bold uppercase px-2 py-1 rounded-full ${
                              user.is_premium ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {user.is_premium ? "Premium" : "Free"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Call Log Modal */}
      {callModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-brand-600" />
                  Record Call Log: {callModalUser.first_name} {callModalUser.last_name}
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  {callModalUser.profileId || `MN-${100000 + callModalUser.id}`} · Mobile: {callModalUser.mobile_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCallModalUser(null)}
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
                onClick={() => setCallModalUser(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Document Preview Modal */}
      {docModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  ID Proof: {docModalUser.first_name} {docModalUser.last_name}
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  {docModalUser.profileId || `MN-${100000 + docModalUser.id}`} · Status: {docModalUser.kyc_status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDocModalUser(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {docModalUser.kyc_front_url && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1.5 px-1">
                    <span>Front Document</span>
                    <a
                      href={resolveDocUrl(docModalUser.kyc_front_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-0.5"
                    >
                      Open Full <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <img
                    src={resolveDocUrl(docModalUser.kyc_front_url)}
                    alt="Front ID"
                    className="w-full max-h-56 object-contain rounded-lg bg-white p-1"
                  />
                </div>
              )}

              {docModalUser.kyc_back_url && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1.5 px-1">
                    <span>Back Document</span>
                    <a
                      href={resolveDocUrl(docModalUser.kyc_back_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-0.5"
                    >
                      Open Full <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <img
                    src={resolveDocUrl(docModalUser.kyc_back_url)}
                    alt="Back ID"
                    className="w-full max-h-56 object-contain rounded-lg bg-white p-1"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <Link
                href="/admin/id-verification"
                onClick={() => setDocModalUser(null)}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl text-center transition-colors"
              >
                Manage Verification in KYC Hub →
              </Link>
              <button
                type="button"
                onClick={() => setDocModalUser(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
