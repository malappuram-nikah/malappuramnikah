import { API_URL } from "./config";

import { getToken } from "./auth-session";

export function getAdminToken(): string | null {
  return getToken();
}

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new AdminApiError(data.message || "Request failed", res.status);
  }
  return data as T;
}

export interface AdminAnalytics {
  dailyRegistrations: { date: string; label: string; count: number }[];
  monthlyRegistrations: { month: string; label: string; count: number }[];
  usersByGender: { label: string; value: number }[];
  usersByStatus: { label: string; value: number }[];
  usersByKyc: { label: string; value: number }[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  suspendedUsers: number;
  inactiveUsers: number;
  premiumUsers: number;
  averageCompletion: number;
  kycPending: number;
  kycUnderReview: number;
  kycVerified: number;
  kycRejected: number;
  referralTotal: number;
  referralSuccess: number;
  referralPending: number;
  analytics?: AdminAnalytics;
}

export interface AdminUser {
  id: number;
  uuid: string | null;
  profile_for: string;
  gender: string;
  first_name: string;
  last_name: string;
  cast: string;
  location: string;
  email: string | null;
  mobile_number: string;
  dob: string;
  status: string;
  is_premium: boolean;
  is_new_user: boolean;
  last_login: string | null;
  profile_details: Record<string, unknown> | null;
  kyc_status: string;
  kyc_document_type: string | null;
  kyc_front_url: string | null;
  kyc_back_url: string | null;
  kyc_rejected_reason: string | null;
  kyc_submitted_at: string | null;
  kyc_verified_at: string | null;
  call_status?: string | null;
  called_date?: string | null;
  call_response?: string | null;
  created_at: string;
  updated_at: string;
  referral_code: string | null;
  referral_points: number;
  profileId?: string;
  profileCompletion?: { percentage: number; completedSteps: number; totalSteps: number };
}

export const adminApi = {
  getStats: () => adminFetch<{ success: true; stats: AdminStats }>("/user/admin/stats"),

  getUsers: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return adminFetch<{
      success: true;
      users: AdminUser[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/user/admin/users?${qs}`);
  },

  getUser: (id: number) =>
    adminFetch<{ success: true; user: AdminUser }>(`/user/admin/users/${id}`),

  updateUserStatus: (id: number, action: "activate" | "deactivate" | "suspend" | "restore") =>
    adminFetch<{ success: true; message: string; user: AdminUser }>(`/user/admin/users/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  updateCallLog: (
    id: number,
    data: { call_status?: string; called_date?: string | null; call_response?: string | null }
  ) =>
    adminFetch<{ success: true; message: string; user: AdminUser }>(`/user/admin/users/${id}/call-log`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  togglePremium: (id: number) =>
    adminFetch<{ success: true; message: string; is_premium: boolean }>(
      `/user/admin/users/${id}/toggle-premium`,
      { method: "POST" }
    ),

  getKycRequests: (params?: { search?: string; status?: string; gender?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.gender) qs.set("gender", params.gender);
    const q = qs.toString();
    return adminFetch<{ success: true; requests: AdminUser[] }>(
      `/user/admin/kyc/requests${q ? `?${q}` : ""}`
    );
  },

  kycReview: (id: number) =>
    adminFetch(`/user/admin/kyc/${id}/review`, { method: "POST" }),

  kycApprove: (id: number) =>
    adminFetch(`/user/admin/kyc/${id}/approve`, { method: "POST" }),

  kycReject: (id: number, reason: string) =>
    adminFetch(`/user/admin/kyc/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getAdminProfile: () =>
    adminFetch<{ success: true; admin: AdminUser & { role: string; isAdmin: boolean } }>(
      "/user/admin/me"
    ),

  updateAdminProfile: (data: { first_name?: string; last_name?: string; email?: string | null }) =>
    adminFetch("/user/admin/me", { method: "PUT", body: JSON.stringify(data) }),

  changeAdminPassword: (currentPassword: string, newPassword: string) =>
    adminFetch("/user/admin/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getReferralRecords: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return adminFetch<{
      success: true;
      records: Array<{
        id: number;
        referrer_id: number;
        referred_user_id: number;
        referral_code: string;
        status: string;
        rewarded: boolean;
        created_at: string;
        referrer: { id: number; first_name: string; last_name: string; mobile_number: string; referral_code: string | null };
        referred_user: { id: number; first_name: string; last_name: string; mobile_number: string; kyc_status: string; created_at: string };
      }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/user/admin/referral-records?${qs}`);
  },

  instantRegistration: (base64File: string, mimeType: string) =>
    adminFetch<{
      success: true;
      message: string;
      data: {
        userId: number;
        profileId: string;
        fullName: string;
        mobile: string;
        rawPassword: string;
        gender: string;
        location: string;
        caste: string;
        documentUrl: string;
        dateOfBirth: string;
      };
    }>("/user/admin/instant-registration", {
      method: "POST",
      body: JSON.stringify({ base64File, mimeType }),
    }),
};
