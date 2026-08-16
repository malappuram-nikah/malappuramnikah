"use client";

import { useEffect, useState } from "react";
import { User, ShieldCheck, Sparkles } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { handleSignOut } from "@/lib/auth";
import { adminApi } from "@/lib/admin-api";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    role: "admin",
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminApi
      .getAdminProfile()
      .then((res) => {
        setProfile({
          first_name: res.admin.first_name,
          last_name: res.admin.last_name,
          email: res.admin.email || "",
          mobile_number: res.admin.mobile_number,
          role: res.admin.role || "admin",
        });
      })
      .catch(() => triggerAlert("Failed to load admin profile.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateAdminProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email || null,
      });
      triggerAlert("Profile updated successfully.");
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      triggerAlert("New passwords do not match.", "error");
      return;
    }
    setSaving(true);
    try {
      await adminApi.changeAdminPassword(passwords.current, passwords.newPass);
      triggerAlert("Password changed successfully.");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err: unknown) {
      triggerAlert(err instanceof Error ? err.message : "Password change failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <AdminAlert alert={alert} />
      <AdminPageHeader
        title="Admin Profile"
        description="Manage your admin account information and security settings."
        icon={User}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" /> Profile Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">First Name</label>
              <input
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
              <input
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile</label>
            <input
              value={profile.mobile_number}
              disabled
              className="w-full mt-1 px-3 py-2 text-xs border border-gray-100 rounded-xl bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Role</label>
            <div className="mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-brand-700 capitalize">{profile.role}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
          >
            Save Profile
          </button>
        </form>

        <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Change Password</h2>

          {["current", "newPass", "confirm"].map((field) => (
            <div key={field}>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                {field === "current" ? "Current Password" : field === "newPass" ? "New Password" : "Confirm Password"}
              </label>
              <input
                type="password"
                value={passwords[field as keyof typeof passwords]}
                onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-xl"
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl disabled:opacity-50"
          >
            Update Password
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full mt-4 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
