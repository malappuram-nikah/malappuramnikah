"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Search, Check, X, ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const ACCOUNT_STATUS_OPTIONS = [
  { id: "", label: "All Accounts" },
  { id: "active", label: "Active" },
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
        description="Search, filter, and manage member accounts from the database."
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
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl sm:ml-auto"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Sparkles className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <>
            <p className="text-[10px] text-gray-400 font-semibold">
              {total} users found · showing {users.length} per page
            </p>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                    <th className="p-3.5 w-10">#</th>
                    <th className="p-3.5">Member</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Profile ID</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Account</th>
                    <th className="p-3.5">KYC</th>
                    <th className="p-3.5">Completion</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3.5 font-bold text-gray-400">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-[10px] text-gray-400">{user.mobile_number}</p>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${user.gender?.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {user.gender || 'Male'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-gray-600">{user.profileId}</td>
                      <td className="p-3.5 text-gray-600">{user.location}</td>
                      <td className="p-3.5">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge(user.status)}`}>
                          {user.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${kycBadge(user.kyc_status)}`}>
                          {user.kyc_status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-gray-700">
                        {user.profileCompletion?.percentage ?? 0}%
                      </td>
                      <td className="p-3.5 text-[10px] text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-end gap-1">
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
                              title="Activate"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusAction(user.id, "suspend")}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg"
                              title="Suspend"
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
    </div>
  );
}
