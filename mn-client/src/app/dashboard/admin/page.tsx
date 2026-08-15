"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, ShieldCheck, Heart, Sparkles, User, KeyRound, Camera,
  DollarSign, ShoppingBag, Calendar, Image, FileText,
  AlertTriangle, CreditCard, LayoutGrid, BarChart3,
  TrendingUp, Download, Plus, Check, X, Search,
  Lock, Unlock, Award, Settings, Layers, Megaphone, Eye, Phone, Mail, GraduationCap, Volume2, Video, Percent, Clock,
  Briefcase, Star, MapPin, ChevronRight, HelpCircle, Music, MessageSquarePlus, Loader2
} from "lucide-react";

import { useRouter } from "next/navigation";
import { LOCATIONS } from "@/lib/constants";
import { API_URL } from "@/lib/config";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("analytics");
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    pendingApproval: 0,
    averageCompletion: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    vendorRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    saveTheDateUsage: 0,
    invitationUsage: 0
  });

  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any>({
    vendors: [],
    bookings: [],
    templates_save_the_date: [],
    templates_wedding_invitation: [],
    reports: [],
    subscriptions: [],
    cms: { banner_message: "", faqs: [], stories: [] },
    activity_logs: [],
    biodata_settings: { enable_download: true },
    biodata_downloads: []
  });
  const [biodataEnabled, setBiodataEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [defaultTrackUrl, setDefaultTrackUrl] = useState("");
  const [uploadingTrack, setUploadingTrack] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [newVendorForm, setNewVendorForm] = useState({ name: "", category: "Photography", location: "", contact: "", commission_rate: 10 });
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [cmsBanner, setCmsBanner] = useState("");
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [selectedKycRequest, setSelectedKycRequest] = useState<any | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState("");
  const [showKycRejectModal, setShowKycRejectModal] = useState(false);
  const [kycStatusFilter, setKycStatusFilter] = useState<string>("ALL");

  // Feedback Management States
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>({ total: 0, averageRating: 0, bugs: 0, suggestions: 0, appreciations: 0, others: 0 });
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>("ALL");
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<string>("ALL");
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);


  // User Inspection States
  const [inspectUserId, setInspectUserId] = useState<number | null>(null);
  const [inspectUserLoading, setInspectUserLoading] = useState(false);
  const [inspectUser, setInspectUser] = useState<any | null>(null);

  // Server-Side Search, Filter & Pagination States
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [userGenderFilter, setUserGenderFilter] = useState("ALL");
  const [userLoading, setUserLoading] = useState(false);

  const [kycPage, setKycPage] = useState(1);
  const [kycTotalPages, setKycTotalPages] = useState(1);
  const [kycTotal, setKycTotal] = useState(0);
  const [kycDocTypeFilter, setKycDocTypeFilter] = useState("ALL");
  const [kycLoading, setKycLoading] = useState(false);

  // Admin Profile States
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    avatar_url: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadAdminProfile = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;
      const res = await fetch(`${API_URL}/user/admin/me`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.success && data.admin) {
        setAdminProfile(data.admin);
        setProfileForm({
          first_name: data.admin.first_name || "",
          last_name: data.admin.last_name || "",
          email: data.admin.email || "",
          mobile_number: data.admin.mobile_number || "",
          avatar_url: data.admin.avatar_url || ""
        });
      }
    } catch (e) {
      console.error("Failed to load admin profile", e);
    }
  };

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.first_name.trim()) {
      triggerAlert("First name is required.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setAdminProfile(data.admin);
        triggerAlert(data.message || "Admin profile updated successfully!");
        await loadAdminData();
      } else {
        triggerAlert(data.message || "Failed to update profile.", "error");
      }
    } catch (err) {
      triggerAlert("Server error updating profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current_password) {
      triggerAlert("Current password is required.", "error");
      return;
    }
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      triggerAlert("New password must be at least 6 characters long.", "error");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      triggerAlert("New password and confirm password do not match.", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert(data.message || "Password changed successfully!");
        setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      } else {
        triggerAlert(data.message || "Password change failed.", "error");
      }
    } catch (err) {
      triggerAlert("Server error changing password.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAdminAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerAlert("Please select an image file (JPG, PNG, WebP).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm(prev => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenInspectUser = async (userId: number) => {
    setInspectUserId(userId);
    setInspectUserLoading(true);
    setInspectUser(null);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/users/${userId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.user) {
        setInspectUser(data.user);
      } else {
        triggerAlert(data.message || "Failed to fetch user profile.", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("Failed to load user details from database.", "error");
    } finally {
      setInspectUserLoading(false);
    }
  };

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      triggerAlert("Please select a valid audio file (MP3, WAV, etc.)", "error");
      return;
    }

    setUploadingTrack(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await handleStoreUpdate("music_settings", "upload_track", { fileData: base64 });
        setUploadingTrack(false);
      };
      reader.onerror = () => {
        triggerAlert("Failed to read the audio file.", "error");
        setUploadingTrack(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      triggerAlert("Failed to upload music track.", "error");
      setUploadingTrack(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        router.push("/admin/login");
        return;
      }

      // 1. Fetch Stats & Activity Logs
      const statsRes = await fetch(`${API_URL}/user/admin/stats`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      if (statsRes.status === 403 || statsRes.status === 401) {
        localStorage.removeItem("mn_token");
        triggerAlert("Access denied. Admin privileges required.", "error");
        router.push("/admin/login");
        return;
      }

      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Fetch Stateful Store Data
      const storeRes = await fetch(`${API_URL}/user/admin/store`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const storeDataJson = await storeRes.json();
      if (storeDataJson.success) {
        setStoreData(storeDataJson.store);
        setCmsBanner(storeDataJson.store.cms.banner_message || "");
        setBiodataEnabled(storeDataJson.store.biodata_settings?.enable_download !== false);
        setMusicEnabled(storeDataJson.store.music_settings?.enable_music !== false);
        setDefaultTrackUrl(storeDataJson.store.music_settings?.default_track || "");
      }

      // 3. Fetch Database Users List with Server-Side Pagination & Filters
      await loadUsersData(1, "", "ALL", "ALL");

      // 4. Fetch KYC Requests List with Server-Side Pagination & Filters
      await loadKycRequestsData(1, "", "ALL", "ALL");

      // 5. Fetch User Feedbacks & Stats
      await loadFeedbacksData();

      // 6. Fetch Admin Profile
      await loadAdminProfile();

    } catch (e) {
      console.error("Admin data loading failed:", e);
      triggerAlert("Server communication error.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadUsersData = async (
    pageVal = userPage,
    searchVal = searchQuery,
    statusVal = userStatusFilter,
    genderVal = userGenderFilter
  ) => {
    setUserLoading(true);
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;

      const queryParams = new URLSearchParams({
        page: pageVal.toString(),
        limit: "10",
        search: searchVal,
        status: statusVal,
        gender: genderVal
      });

      const usersRes = await fetch(`${API_URL}/user/admin/users?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setDbUsers(usersData.users);
        if (usersData.pagination) {
          setUserPage(usersData.pagination.page);
          setUserTotalPages(usersData.pagination.totalPages);
          setUserTotal(usersData.pagination.total);
        }
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setUserLoading(false);
    }
  };

  const loadKycRequestsData = async (
    pageVal = kycPage,
    searchVal = searchQuery,
    statusVal = kycStatusFilter,
    docTypeVal = kycDocTypeFilter
  ) => {
    setKycLoading(true);
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;

      const queryParams = new URLSearchParams({
        page: pageVal.toString(),
        limit: "10",
        search: searchVal,
        status: statusVal,
        docType: docTypeVal
      });

      const kycRes = await fetch(`${API_URL}/user/admin/kyc/requests?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const kycData = await kycRes.json();
      if (kycData.success) {
        setKycRequests(kycData.requests);
        if (kycData.pagination) {
          setKycPage(kycData.pagination.page);
          setKycTotalPages(kycData.pagination.totalPages);
          setKycTotal(kycData.pagination.total);
        }
      }
    } catch (e) {
      console.error("Failed to load KYC requests:", e);
    } finally {
      setKycLoading(false);
    }
  };

  const loadFeedbacksData = async () => {
    setLoadingFeedbacks(true);
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) return;
      const res = await fetch(`${API_URL}/user/admin/feedback`, {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
        setFeedbackStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to load feedbacks:", e);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/feedback/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("Feedback log deleted successfully!");
        setSelectedFeedback(null);
        await loadFeedbacksData();
      } else {
        triggerAlert(data.message || "Failed to delete feedback.", "error");
      }
    } catch (e) {
      triggerAlert("Failed to delete feedback.", "error");
    }
  };


  useEffect(() => {
    loadAdminData();
  }, []);

  // React immediately to sidebar clicks by syncing URL query params to activeTab
  const currentSearch = typeof window !== "undefined" ? window.location.search : "";
  useEffect(() => {
    const params = new URLSearchParams(currentSearch);
    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [currentSearch]);

  // Action: Approve or Reject a Matrimony Profile
  const handleVerifyUser = async (userId: number, action: "approve" | "reject") => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/users/${userId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert(`Profile successfully ${action === "approve" ? "approved" : "deactivated"}!`);
        await loadAdminData();
      } else {
        triggerAlert(data.message || "Action failed.", "error");
      }
    } catch (e) {
      triggerAlert("Operation failed.", "error");
    }
  };

  // Action: Toggle Premium Account Status
  const handleTogglePremium = async (userId: number) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/users/${userId}/toggle-premium`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert(data.message || "Premium plan updated!");
        await loadAdminData();
      }
    } catch (e) {
      triggerAlert("Failed to update plan.", "error");
    }
  };

  // Action: Stateful store transactions (Vendors, Bookings, Template states, CMS edit)
  const handleStoreUpdate = async (type: string, action: string, payload: any) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/store/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify({ type, action, payload })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("Updates successfully saved to system store!");
        await loadAdminData();
      }
    } catch (e) {
      triggerAlert("Failed to submit update.", "error");
    }
  };

  const handleKycReview = async (requestId: number) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/kyc/${requestId}/review`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.success) {
        await loadAdminData();
        setSelectedKycRequest((prev: any) => prev && prev.id === requestId ? { ...prev, kyc_status: "UNDER_REVIEW" } : prev);
      }
    } catch (e) {
      console.error("Failed to move request to UNDER_REVIEW", e);
    }
  };

  const handleKycApprove = async (requestId: number) => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/kyc/${requestId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("Identity verification approved successfully!");
        setSelectedKycRequest(null);
        await loadAdminData();
      } else {
        triggerAlert(data.message || "Failed to approve request.", "error");
      }
    } catch (e) {
      triggerAlert("Server error during approval.", "error");
    }
  };

  const handleKycReject = async (requestId: number) => {
    if (!kycRejectReason.trim()) {
      triggerAlert("Rejection reason is required.", "error");
      return;
    }
    try {
      const storedToken = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/admin/kyc/${requestId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${storedToken}`
        },
        body: JSON.stringify({ reason: kycRejectReason })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert("Identity verification request rejected.");
        setShowKycRejectModal(false);
        setKycRejectReason("");
        setSelectedKycRequest(null);
        await loadAdminData();
      } else {
        triggerAlert(data.message || "Failed to reject request.", "error");
      }
    } catch (e) {
      triggerAlert("Server error during rejection.", "error");
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name || !newVendorForm.location) {
      triggerAlert("Please complete all vendor fields.", "error");
      return;
    }
    await handleStoreUpdate("vendor", "create", newVendorForm);
    setNewVendorForm({ name: "", category: "Photography", location: "", contact: "", commission_rate: 10 });
    setShowAddVendor(false);
  };

  // Action: Simulate Export Report CSV downloads
  const handleExportData = (dataType: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (dataType === "users") {
      csvContent += "ID,Name,Phone,Gender,Caste,Location,Status,Premium\n";
      dbUsers.forEach(u => {
        csvContent += `${u.id},"${u.first_name} ${u.last_name}",${u.mobile_number},${u.gender},${u.cast},"${u.location}",${u.status},${u.is_premium}\n`;
      });
    } else if (dataType === "revenue") {
      csvContent += "Category,Description,Amount,Commission Earned\n";
      csvContent += `Vendor Services,Catering Stage Decor Stage DJ & photography bookings,${stats.vendorRevenue},${stats.totalRevenue - (stats.premiumUsers * 1999)}\n`;
      csvContent += `Premium Membership,Matrimony package subscriptions (${stats.premiumUsers} plans),${stats.premiumUsers * 1999},${stats.premiumUsers * 1999}\n`;
    } else {
      csvContent += "Booking ID,Customer,Vendor,Event Date,Amount Paid,Commission Earned,Status\n";
      storeData.bookings.forEach((b: any) => {
        csvContent += `${b.id},${b.user},"${b.vendor}",${b.date},${b.amount},${b.commission},${b.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Nikah_SuperAdmin_${dataType}_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert("CSV Report exported successfully!");
  };

  const filteredUsers = dbUsers.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.mobile_number.includes(searchQuery) ||
    u.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const managementModules = [
    { id: "analytics",     icon: BarChart3,      label: "Analytics Core",      color: "border-brand-500/20 text-brand-600" },
    { id: "users",         icon: Users,          label: "User Accounts",       color: "border-teal-500/20 text-teal-600" },
    { id: "profiles",      icon: Heart,          label: "Matrimony Profiles",  color: "border-pink-500/20 text-pink-600" },
    { id: "kyc",           icon: ShieldCheck,    label: "Identity KYC",        color: "border-blue-500/20 text-blue-600" },
    { id: "referrals",     icon: Award,          label: "Referrals & Wallet",  color: "border-amber-500/20 text-amber-600" },
    { id: "reports",       icon: AlertTriangle,  label: "Complaints Grid",     color: "border-red-500/20 text-red-600" },
    { id: "feedbacks",     icon: MessageSquarePlus, label: "User Feedbacks",    color: "border-teal-500/20 text-teal-600" },
    { id: "subscriptions", icon: CreditCard,     label: "Premium Plans",       color: "border-indigo-500/20 text-indigo-600" },
    { id: "cms",           icon: Megaphone,      label: "CMS & Story Sliders", color: "border-cyan-500/20 text-cyan-600" },
    { id: "biodata",       icon: FileText,       label: "Biodata Downloads",   color: "border-amber-500/20 text-amber-600" },
    { id: "music",         icon: Music,          label: "Ambient Music",       color: "border-purple-500/20 text-purple-600" },
    { id: "profile",       icon: User,           label: "Admin Profile",       color: "border-slate-500/20 text-slate-600" }
  ];


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
          <Sparkles className="w-10 h-10 text-brand-500" />
        </motion.div>
        <p className="font-semibold mt-4 text-sm text-gray-600">Syncing with Super Admin Core...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Alerts Banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-3 ${
              alertMsg.type === "success" 
                ? "bg-brand-50/90 text-brand-800 border-brand-200" 
                : "bg-red-50/90 text-red-800 border-red-200"
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${alertMsg.type === "success" ? "text-brand-600" : "text-red-600"}`} />
            <span className="text-xs font-semibold">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Admin Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-brand-100 text-brand-700 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                Super User
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-gray-400 font-semibold">Active Database Sync</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-brand-600" /> Super Admin Command Center
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Verify members, approve vendors, manage pricing matrixes, and audit platform revenue.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-3 py-2 border text-xs font-bold rounded-xl transition-all flex items-center gap-2 active:scale-[0.98] ${
                activeTab === "profile"
                  ? "bg-brand-50 border-brand-300 text-brand-700 shadow-sm"
                  : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
              }`}
              title="View and Edit Admin Profile"
            >
              <div className="w-5 h-5 rounded-md bg-brand-600 text-white font-extrabold flex items-center justify-center text-[10px] overflow-hidden">
                {adminProfile?.avatar_url ? (
                  <img src={adminProfile.avatar_url} alt="Admin Avatar" className="w-full h-full object-cover" />
                ) : (
                  adminProfile?.first_name?.[0]?.toUpperCase() || "A"
                )}
              </div>
              <span className="truncate max-w-[120px]">
                {adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name || ""}`.trim() : "Admin Profile"}
              </span>
            </button>
            <button
              onClick={() => handleExportData("users")}
              className="px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-gray-400" /> Export Users
            </button>
            <button
              onClick={() => handleExportData("bookings")}
              className="px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-600/10 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <FileText className="w-4 h-4" /> Export Orders
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("mn_token");
                triggerAlert("Admin logged out successfully.");
                setTimeout(() => router.push("/admin/login"), 500);
              }}
              className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all border border-red-200 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4 text-red-600" /> Admin Logout
            </button>
          </div>
        </div>
      </header>

      {/* Key Metric Overview Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Platform Users", value: stats.totalUsers || 0, desc: `${stats.activeUsers || 0} active • ${stats.pendingApproval || 0} pending`, icon: Users, color: "bg-teal-50 text-teal-600" },
          { label: "Verified Member Profiles", value: stats.verifiedUsers || 0, desc: `${stats.newUsers || 0} new user registrations`, icon: UserCheck, color: "bg-pink-50 text-pink-600" },
          { label: "Pending ID Verifications", value: stats.pendingKyc || 0, desc: `${stats.verifiedKyc || 0} verified • ${stats.rejectedKyc || 0} rejected`, icon: ShieldCheck, color: "bg-blue-50 text-blue-600" },
          { label: "Total Revenue & Premium", value: `INR ${stats.totalRevenue || 0}`, desc: `${stats.premiumUsers || 0} Gold subscribers`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow group">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{item.value}</h3>
              <p className="text-[10px] text-gray-500 mt-1.5 font-medium">{item.desc}</p>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </section>

      {/* Primary Split View: Tab switcher on left, workspace content on right */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column Tab Navigation */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1 shadow-sm">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-3">Management Modules</h2>
            {managementModules.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "referrals") {
                      router.push("/dashboard/admin/referrals");
                    } else {
                      setActiveTab(item.id);
                      setSearchQuery("");
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-semibold transition-all group ${
                    isActive 
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/10" 
                      : "text-gray-600 hover:bg-brand-50/50 hover:text-brand-700"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-gray-400 group-hover:text-brand-600"
                  }`} />
                  <span className="flex-1">{item.label}</span>
                  {item.id === "profiles" && stats.pendingApproval > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? "bg-white text-brand-700" : "bg-pink-100 text-pink-700"
                    }`}>
                      {stats.pendingApproval} New
                    </span>
                  )}
                  {item.id === "kyc" && kycRequests.filter(r => r.kyc_status === "PENDING" || r.kyc_status === "UNDER_REVIEW").length > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? "bg-white text-blue-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {kycRequests.filter(r => r.kyc_status === "PENDING" || r.kyc_status === "UNDER_REVIEW").length} New
                    </span>
                  )}
                  {item.id === "reports" && storeData.reports.filter((r:any)=>r.status === "PENDING").length > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? "bg-white text-red-700" : "bg-red-100 text-red-700 animate-pulse"
                    }`}>
                      {storeData.reports.filter((r:any)=>r.status === "PENDING").length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Platform Performance Block */}
          <div className="bg-gradient-to-br from-brand-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-brand-600/10">
            <h4 className="font-bold text-sm">Platform Health Score</h4>
            <p className="text-[10px] text-brand-100 mt-1">Matrimonial database and standard template rendering rates.</p>
            <div className="flex items-end gap-3 mt-4">
              <div className="text-3xl font-extrabold">98.4%</div>
              <TrendingUp className="w-5 h-5 text-brand-200 mb-1" />
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-brand-200 h-full rounded-full" style={{ width: "98.4%" }} />
            </div>
          </div>
        </aside>

        {/* Right Column Core Workspace Panel */}
        <main className="lg:col-span-9">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[520px]">
            <AnimatePresence mode="wait">
              
              {/* Tab 1: Analytics & Metrics Hub */}
              {activeTab === "analytics" && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <BarChart3 className="w-5 h-5 text-brand-600" /> Platform Analytics Hub
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">Statistical distributions, matching trends, and platform KPIs.</p>
                    </div>
                    <button
                      onClick={() => handleExportData("revenue")}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Export Revenue CSV
                    </button>
                  </div>

                  {/* 3 Rich Interactive SVG Visual Charts */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* SVG Chart 1: Revenue Trends */}
                    <div className="border border-gray-100 rounded-xl p-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Gross Revenue Trend</h4>
                      <div className="h-32 w-full flex items-end">
                        <svg className="w-full h-full" viewBox="0 0 300 120">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0,90 A 40,40 0 0,1 60,65 T 120,50 T 180,35 T 240,40 T 300,10" fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
                          <path d="M 0,90 A 40,40 0 0,1 60,65 T 120,50 T 180,35 T 240,40 T 300,10 L 300,120 L 0,120 Z" fill="url(#chartGrad)" />
                          <line x1="0" y1="110" x2="300" y2="110" stroke="#f3f4f6" strokeWidth="1" />
                        </svg>
                      </div>
                      <div className="flex justify-between text-[8px] text-gray-400 font-bold mt-2">
                        <span>JAN</span><span>MAR</span><span>MAY</span><span>JUN</span>
                      </div>
                    </div>

                    {/* SVG Chart 2: Monthly Registrations */}
                    <div className="border border-gray-100 rounded-xl p-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">New Member Growth</h4>
                      <div className="h-32 w-full flex items-end justify-between px-2 gap-1.5">
                        {(stats.monthlyRegistrations && stats.monthlyRegistrations.length > 0
                          ? stats.monthlyRegistrations
                          : [
                              { month: "Jan", count: 40 },
                              { month: "Feb", count: 65 },
                              { month: "Mar", count: 80 },
                              { month: "Apr", count: 50 },
                              { month: "May", count: 95 },
                              { month: "Jun", count: 110 }
                            ]
                        ).map((item: any, i: number) => {
                          const maxVal = Math.max(...(stats.monthlyRegistrations?.map((m: any) => m.count) || [110]), 10);
                          const barHeight = Math.max(Math.min(Math.round((item.count / maxVal) * 90) + 15, 100), 15);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center">
                              <div className="w-full bg-brand-500/10 hover:bg-brand-500/25 rounded-t-md transition-colors relative group" style={{ height: `${barHeight}px` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {item.count} users
                                </div>
                                <div className="w-full bg-brand-600 rounded-t-md absolute bottom-0" style={{ height: "45%" }} />
                              </div>
                              <span className="text-[8px] text-gray-400 font-bold mt-1.5 uppercase">{item.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SVG Chart 3: Profile Completion Ring */}
                    <div className="border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 self-start">Completion Stats</h4>
                      <div className="relative w-24 h-24 mt-2">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-brand-600" strokeDasharray={`${stats.averageCompletion}, 100`} strokeWidth="3.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-base font-extrabold text-gray-800">{stats.averageCompletion}%</span>
                          <span className="text-[7px] text-gray-400 font-bold uppercase">Average</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-gray-500 font-medium text-center mt-3">Overall profile field density rate</p>
                    </div>
                  </div>

                  {/* Real Database Recent Activity Grids */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Recent Registrations */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-white space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-teal-600" /> Recent Registrations
                        </h3>
                        <button onClick={() => setActiveTab("users")} className="text-[10px] font-semibold text-brand-600 hover:underline">
                          View All ({stats.totalUsers || 0})
                        </button>
                      </div>

                      {(!stats.recentRegistrations || stats.recentRegistrations.length === 0) ? (
                        <div className="py-8 text-center text-gray-400 text-xs font-medium bg-gray-50 rounded-xl">
                          No recent member registrations found.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {stats.recentRegistrations.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/60 border border-gray-100 text-xs hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="font-bold text-gray-900 text-xs">{u.first_name} {u.last_name}</p>
                                <p className="text-[10px] text-gray-400 font-semibold">{u.mobile_number} • ID: #MN-{u.id}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  u.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {u.status === "active" ? "Active" : "Pending"}
                                </span>
                                <p className="text-[9px] text-gray-400 font-semibold mt-1">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent ID Verification Requests */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-white space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-600" /> Recent ID Verification Requests
                        </h3>
                        <button onClick={() => setActiveTab("kyc")} className="text-[10px] font-semibold text-blue-600 hover:underline">
                          Inspect All ({stats.pendingKyc || 0} Pending)
                        </button>
                      </div>

                      {(!stats.recentKycRequests || stats.recentKycRequests.length === 0) ? (
                        <div className="py-8 text-center text-gray-400 text-xs font-medium bg-gray-50 rounded-xl">
                          No recent ID verification submissions.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {stats.recentKycRequests.map((k: any) => (
                            <div key={k.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/60 border border-gray-100 text-xs hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="font-bold text-gray-900 text-xs">{k.first_name} {k.last_name}</p>
                                <p className="text-[10px] text-gray-400 font-semibold">{k.kyc_document_type || "Aadhaar Card"} • {k.mobile_number}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  k.kyc_status === "VERIFIED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : k.kyc_status === "PENDING"
                                    ? "bg-blue-100 text-blue-800"
                                    : k.kyc_status === "UNDER_REVIEW"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {k.kyc_status.replace("_", " ")}
                                </span>
                                <p className="text-[9px] text-gray-400 font-semibold mt-1">
                                  {k.kyc_submitted_at ? new Date(k.kyc_submitted_at).toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stateful Platform Audit logs */}
                  <div className="border border-gray-100 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brand-600" /> Platform Security & Activity Audits
                    </h3>
                    <div className="space-y-3.5 max-h-56 overflow-y-auto">
                      {storeData.activity_logs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 text-[11px] border border-gray-100 hover:border-gray-200 transition-colors">
                          <span className="bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded text-[8px] uppercase">{log.admin}</span>
                          <p className="flex-1 text-gray-700 font-medium">{log.action}</p>
                          <span className="text-[9px] text-gray-400 font-bold shrink-0">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: User Accounts List */}
              {activeTab === "users" && (
                <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <Users className="w-5 h-5 text-teal-600" /> User Database Manager
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">Showing {dbUsers.length} of {userTotal} registered member accounts.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-56">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search name, ID, phone..."
                          value={searchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearchQuery(val);
                            setUserPage(1);
                            loadUsersData(1, val, userStatusFilter, userGenderFilter);
                          }}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                        />
                      </div>

                      <select
                        value={userStatusFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserStatusFilter(val);
                          setUserPage(1);
                          loadUsersData(1, searchQuery, val, userGenderFilter);
                        }}
                        className="p-2 text-xs rounded-xl border border-gray-200 focus:outline-none bg-gray-50 text-gray-700 font-semibold cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="active">Active / Verified</option>
                        <option value="in_active">Pending Approval</option>
                      </select>

                      <select
                        value={userGenderFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserGenderFilter(val);
                          setUserPage(1);
                          loadUsersData(1, searchQuery, userStatusFilter, val);
                        }}
                        className="p-2 text-xs rounded-xl border border-gray-200 focus:outline-none bg-gray-50 text-gray-700 font-semibold cursor-pointer"
                      >
                        <option value="ALL">All Genders</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>

                      {(searchQuery || userStatusFilter !== "ALL" || userGenderFilter !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setUserStatusFilter("ALL");
                            setUserGenderFilter("ALL");
                            setUserPage(1);
                            loadUsersData(1, "", "ALL", "ALL");
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                          <th className="p-3.5">Member Details</th>
                          <th className="p-3.5">Community / Age</th>
                          <th className="p-3.5">Verification</th>
                          <th className="p-3.5">Premium Plan</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userLoading ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-xs text-gray-400 font-semibold bg-gray-50/50">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                              Fetching users from database...
                            </td>
                          </tr>
                        ) : dbUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-gray-400 bg-gray-50/50">
                              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="font-semibold text-xs text-gray-600">No users found.</p>
                              {searchQuery ? (
                                <p className="text-[10px] text-gray-400 mt-1">No matching user records found for "{searchQuery}".</p>
                              ) : (
                                <p className="text-[10px] text-gray-400 mt-1">There are no registered users matching your selected filters.</p>
                              )}
                            </td>
                          </tr>
                        ) : (
                          dbUsers.map(user => (
                            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="p-3.5">
                                <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                                <p className="text-[10px] text-gray-400 font-semibold">{user.mobile_number} • {user.location || "Kerala"} • ID: #MN-{user.id}</p>
                              </td>
                              <td className="p-3.5">
                                <span className="font-semibold text-gray-700 bg-brand-50 px-2 py-0.5 rounded text-[10px]">{user.cast || "General"}</span>
                                <p className="text-[10px] text-gray-400 mt-1 font-bold">Age: {user.dob ? Math.floor((new Date().getTime() - new Date(user.dob).getTime()) / 31557600000) : 25} yrs</p>
                              </td>
                              <td className="p-3.5">
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  user.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {user.status === "active" ? "Verified" : "Pending"}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <button
                                  onClick={() => handleTogglePremium(user.id)}
                                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm hover:scale-105 transition-transform ${
                                    user.is_premium 
                                      ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white" 
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {user.is_premium ? "Active Gold" : "Free Tier"}
                                </button>
                              </td>
                              <td className="p-3.5 text-right space-x-1">
                                <button
                                  onClick={() => handleOpenInspectUser(user.id)}
                                  className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg transition-colors inline-flex items-center"
                                  title="Inspect Full Profile Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {user.status !== "active" ? (
                                  <button
                                    onClick={() => handleVerifyUser(user.id, "approve")}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors inline-flex items-center"
                                    title="Approve Member"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleVerifyUser(user.id, "reject")}
                                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors inline-flex items-center"
                                    title="Deactivate Profile"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Server-Side Pagination Controls */}
                  {userTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                      <span className="text-gray-400 font-semibold">
                        Page <strong className="text-gray-900">{userPage}</strong> of <strong className="text-gray-900">{userTotalPages}</strong> ({userTotal} Total Users)
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={userPage <= 1 || userLoading}
                          onClick={() => {
                            const newPage = userPage - 1;
                            setUserPage(newPage);
                            loadUsersData(newPage, searchQuery, userStatusFilter, userGenderFilter);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Previous
                        </button>
                        <button
                          disabled={userPage >= userTotalPages || userLoading}
                          onClick={() => {
                            const newPage = userPage + 1;
                            setUserPage(newPage);
                            loadUsersData(newPage, searchQuery, userStatusFilter, userGenderFilter);
                          }}
                          className="px-3.5 py-1.5 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Next Page
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 3: Matrimony Profiles Approvals */}
              {activeTab === "profiles" && (
                <motion.div key="profiles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                      <Heart className="w-5 h-5 text-pink-600" /> Matrimony Profile Approvals
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Approve newly created profile details or photos draft before publishing live.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {dbUsers.filter(u => u.status === "in_active").length === 0 ? (
                      <div className="col-span-2 py-16 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-brand-500 opacity-60" />
                        <p className="font-semibold text-sm">Perfect Database Consistency!</p>
                        <p className="text-[10px] mt-0.5">No matrimony profiles are currently awaiting approval.</p>
                      </div>
                    ) : (
                      dbUsers.filter(u => u.status === "in_active").map(user => (
                        <div key={user.id} className="border border-gray-100 rounded-2xl p-5 space-y-4 hover:border-pink-200 transition-all bg-white shadow-sm flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{user.first_name} {user.last_name}</h4>
                                <p className="text-[10px] text-gray-500 font-semibold">{user.location} • {user.gender}</p>
                              </div>
                              <span className="bg-pink-50 text-pink-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                Pending Approval
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Partner Preference draft</p>
                              <p className="text-[10px] text-gray-600 italic">"{user.profile_details?.aboutMe || "Pious Muslim seeking compatible Sunni bride. Family-oriented & values."}"</p>
                              <div className="flex gap-2 mt-2">
                                <span className="bg-brand-50 text-brand-700 text-[9px] font-bold px-1.5 py-0.5 rounded">Caste: {user.cast}</span>
                                <span className="bg-brand-50 text-brand-700 text-[9px] font-bold px-1.5 py-0.5 rounded">Profession: {user.profile_details?.profession || "IT Architect"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2 border-t border-gray-50 mt-4">
                            <button
                              onClick={() => handleVerifyUser(user.id, "approve")}
                              className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1 active:scale-[0.98]"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Profile
                            </button>
                            <button
                              onClick={() => handleVerifyUser(user.id, "reject")}
                              className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-bold rounded-xl border border-gray-200 transition-colors"
                            >
                              Reject & Flag
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Tab: Identity KYC Verification Requests */}
              {activeTab === "kyc" && (
                <motion.div key="kyc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-5 h-5 text-blue-600" /> Identity KYC Verification Center
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Showing {kycRequests.length} of {kycTotal} verification records in database.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-52">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search name, phone, ID..."
                          value={searchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearchQuery(val);
                            setKycPage(1);
                            loadKycRequestsData(1, val, kycStatusFilter, kycDocTypeFilter);
                          }}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                        />
                      </div>

                      <select
                        value={kycStatusFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setKycStatusFilter(val);
                          setKycPage(1);
                          loadKycRequestsData(1, searchQuery, val, kycDocTypeFilter);
                        }}
                        className="p-2 text-xs rounded-xl border border-gray-200 focus:outline-none bg-gray-50 font-semibold text-gray-700 cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending (New)</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="VERIFIED">Verified (Approved)</option>
                        <option value="REJECTED">Rejected</option>
                      </select>

                      <select
                        value={kycDocTypeFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setKycDocTypeFilter(val);
                          setKycPage(1);
                          loadKycRequestsData(1, searchQuery, kycStatusFilter, val);
                        }}
                        className="p-2 text-xs rounded-xl border border-gray-200 focus:outline-none bg-gray-50 font-semibold text-gray-700 cursor-pointer"
                      >
                        <option value="ALL">All ID Types</option>
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Driving License">Driving License</option>
                      </select>

                      {(searchQuery || kycStatusFilter !== "ALL" || kycDocTypeFilter !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setKycStatusFilter("ALL");
                            setKycDocTypeFilter("ALL");
                            setKycPage(1);
                            loadKycRequestsData(1, "", "ALL", "ALL");
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left side: Requests List */}
                    <div className={`${selectedKycRequest ? "lg:col-span-5" : "lg:col-span-12"} space-y-3`}>
                      {kycLoading ? (
                        <div className="py-16 text-center text-xs text-gray-400 font-semibold bg-gray-50 rounded-2xl border border-gray-100">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                          Fetching verification requests...
                        </div>
                      ) : kycRequests.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-blue-500 opacity-60" />
                          <p className="font-semibold text-sm">No verification requests found</p>
                          <p className="text-[10px] mt-0.5">There are no submissions matching your selected search query and filters.</p>
                        </div>
                      ) : (
                        kycRequests.map(req => {
                          const isSelected = selectedKycRequest?.id === req.id;
                          const photo = req.profile_details?.photos?.[0];
                          return (
                            <button
                              key={req.id}
                              onClick={() => {
                                setSelectedKycRequest(req);
                                if (req.kyc_status === "PENDING") {
                                  handleKycReview(req.id);
                                }
                              }}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50/20 shadow-sm"
                                  : "border-gray-100 hover:border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-sm">
                                  {photo ? (
                                    <img src={photo} alt="User Profile" className="w-full h-full object-cover" />
                                  ) : (
                                    req.first_name?.[0]?.toUpperCase() || "U"
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-900 text-xs truncate">
                                    {req.first_name} {req.last_name}
                                  </p>
                                  <p className="text-[10px] text-gray-500 font-medium mt-0.5 truncate">
                                    ID: #MN-{req.id} • {req.kyc_document_type || "Government ID"}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                                    Submitted: {req.kyc_submitted_at ? new Date(req.kyc_submitted_at).toLocaleDateString() : "N/A"}
                                  </p>
                                </div>
                              </div>

                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                req.kyc_status === "VERIFIED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : req.kyc_status === "PENDING"
                                  ? "bg-blue-100 text-blue-800 animate-pulse"
                                  : req.kyc_status === "UNDER_REVIEW"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {req.kyc_status.replace("_", " ")}
                              </span>
                            </button>
                          );
                        })
                      )}

                      {/* KYC Pagination Bar */}
                      {kycTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs mt-4">
                          <span className="text-gray-400 font-semibold text-[11px]">
                            Page <strong className="text-gray-900">{kycPage}</strong> of <strong className="text-gray-900">{kycTotalPages}</strong> ({kycTotal} Total Requests)
                          </span>
                          <div className="flex gap-2">
                            <button
                              disabled={kycPage <= 1 || kycLoading}
                              onClick={() => {
                                const newPage = kycPage - 1;
                                setKycPage(newPage);
                                loadKycRequestsData(newPage, searchQuery, kycStatusFilter, kycDocTypeFilter);
                              }}
                              className="px-3 py-1 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              Prev
                            </button>
                            <button
                              disabled={kycPage >= kycTotalPages || kycLoading}
                              onClick={() => {
                                const newPage = kycPage + 1;
                                setKycPage(newPage);
                                loadKycRequestsData(newPage, searchQuery, kycStatusFilter, kycDocTypeFilter);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side: Detailed inspector */}
                    {selectedKycRequest && (
                      <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-5 space-y-5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-600 text-base">
                              {selectedKycRequest.profile_details?.photos?.[0] ? (
                                <img src={selectedKycRequest.profile_details.photos[0]} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                selectedKycRequest.first_name?.[0]?.toUpperCase() || "U"
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm">
                                {selectedKycRequest.first_name} {selectedKycRequest.last_name}
                              </h3>
                              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                Profile ID: #MN-{selectedKycRequest.id} • {selectedKycRequest.mobile_number} • {selectedKycRequest.location || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenInspectUser(selectedKycRequest.id)}
                              className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl border border-brand-200 transition-colors flex items-center gap-1"
                              title="Inspect Full Profile Details"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Profile
                            </button>
                            <button
                              onClick={() => setSelectedKycRequest(null)}
                              className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Document details card */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Document Type</span>
                            <span className="font-semibold text-gray-800 mt-0.5 block">{selectedKycRequest.kyc_document_type}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Current Status</span>
                            <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${
                              selectedKycRequest.kyc_status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : selectedKycRequest.kyc_status === "PENDING"
                                ? "bg-blue-100 text-blue-800"
                                : selectedKycRequest.kyc_status === "UNDER_REVIEW"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {selectedKycRequest.kyc_status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {/* Document Images Display */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Uploaded Documents</h4>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Front Image */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col justify-between h-48">
                              <div className="bg-gray-100 px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 flex justify-between items-center">
                                <span>Front side</span>
                                {selectedKycRequest.kyc_front_url && (
                                  <a
                                    href={selectedKycRequest.kyc_front_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Open Full Size
                                  </a>
                                )}
                              </div>
                              <div className="flex-1 flex items-center justify-center p-3">
                                {selectedKycRequest.kyc_front_url ? (
                                  <img
                                    src={selectedKycRequest.kyc_front_url}
                                    alt="Front ID"
                                    className="max-h-full max-w-full object-contain rounded-md shadow-sm"
                                  />
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-medium">No Front Document Image</span>
                                )}
                              </div>
                            </div>

                            {/* Back Image */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col justify-between h-48">
                              <div className="bg-gray-100 px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 flex justify-between items-center">
                                <span>Back side</span>
                                {selectedKycRequest.kyc_back_url && (
                                  <a
                                    href={selectedKycRequest.kyc_back_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Open Full Size
                                  </a>
                                )}
                              </div>
                              <div className="flex-1 flex items-center justify-center p-3">
                                {selectedKycRequest.kyc_back_url ? (
                                  <img
                                    src={selectedKycRequest.kyc_back_url}
                                    alt="Back ID"
                                    className="max-h-full max-w-full object-contain rounded-md shadow-sm"
                                  />
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-medium">No Back Document Image</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons or forms */}
                        {selectedKycRequest.kyc_status === "REJECTED" && selectedKycRequest.kyc_rejected_reason && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-xs text-red-800">
                            <span className="font-semibold block">Rejection Reason:</span>
                            "{selectedKycRequest.kyc_rejected_reason}"
                          </div>
                        )}

                        {selectedKycRequest.kyc_status === "VERIFIED" && selectedKycRequest.kyc_verified_at && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-semibold block">Approved and Badge Granted!</span>
                              Verified on: {new Date(selectedKycRequest.kyc_verified_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        {/* If in pending or under review, allow actions */}
                        {(selectedKycRequest.kyc_status === "PENDING" || selectedKycRequest.kyc_status === "UNDER_REVIEW") && (
                          <div className="space-y-4 pt-2 border-t border-gray-100">
                            {showKycRejectModal ? (
                              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-3">
                                <label className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
                                  Specify Rejection Reason
                                </label>
                                <textarea
                                  placeholder="e.g. The uploaded Aadhaar card is blurry and details are unreadable. Please upload a clear scan."
                                  value={kycRejectReason}
                                  onChange={(e) => setKycRejectReason(e.target.value)}
                                  rows={3}
                                  className="w-full p-3 border border-red-200 rounded-xl text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setShowKycRejectModal(false);
                                      setKycRejectReason("");
                                    }}
                                    className="px-3.5 py-2 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleKycReject(selectedKycRequest.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                                  >
                                    Confirm Rejection & Notify
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleKycApprove(selectedKycRequest.id)}
                                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1 active:scale-[0.98]"
                                >
                                  <Check className="w-4 h-4" /> Approve & Grant Badge
                                </button>
                                <button
                                  onClick={() => setShowKycRejectModal(true)}
                                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-100 transition-colors flex items-center justify-center gap-1"
                                >
                                  <X className="w-4 h-4" /> Reject Request
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Tab 4: Wedding Vendor Management */}
              {activeTab === "vendors" && (
                <motion.div key="vendors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <Briefcase className="w-5 h-5 text-amber-600" /> Wedding Vendors Coordinator
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">Approve catering, stages, photography and mehndi service vendors.</p>
                    </div>
                    <button
                      onClick={() => setShowAddVendor(!showAddVendor)}
                      className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1 active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5" /> {showAddVendor ? "Cancel" : "Add Vendor"}
                    </button>
                  </div>

                  {/* Expandable Add Vendor Form */}
                  <AnimatePresence>
                    {showAddVendor && (
                      <motion.form
                        onSubmit={handleCreateVendor}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 border border-gray-200 rounded-2xl p-5 grid sm:grid-cols-2 gap-4"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Vendor Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Malabar stage decors"
                            value={newVendorForm.name}
                            onChange={(e) => setNewVendorForm({...newVendorForm, name: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
                          <select
                            value={newVendorForm.category}
                            onChange={(e) => setNewVendorForm({...newVendorForm, category: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                          >
                            {["Photography", "Catering", "Decoration", "Entertainment", "Mehndi"].map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">City & Location</label>
                          <select
                            value={newVendorForm.location}
                            onChange={(e) => setNewVendorForm({...newVendorForm, location: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none"
                          >
                            <option value="" disabled>Select Location</option>
                            {LOCATIONS.map((loc) => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Number</label>
                          <input
                            type="text"
                            required
                            placeholder="+91 9000000000"
                            value={newVendorForm.contact}
                            onChange={(e) => setNewVendorForm({...newVendorForm, contact: e.target.value})}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="sm:col-span-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98] mt-2"
                        >
                          Register Vendor Now
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Vendor Listing Cards */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {storeData.vendors.map((vendor: any) => (
                      <div key={vendor.id} className="border border-gray-100 bg-white rounded-2xl p-5 shadow-sm space-y-3 hover:border-amber-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{vendor.name}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{vendor.location} • {vendor.contact}</p>
                          </div>
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            vendor.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {vendor.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="font-semibold text-gray-500">Category: <strong className="text-gray-800">{vendor.category}</strong></span>
                          <span className="font-semibold text-gray-500">Rate: <strong className="text-brand-600">{vendor.commission_rate}%</strong></span>
                          <span className="font-semibold text-gray-500 flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-current" /> {vendor.rating}</span>
                        </div>
                        {vendor.status === "PENDING" && (
                          <div className="flex gap-2 pt-1 border-t border-gray-50">
                            <button
                              onClick={() => handleStoreUpdate("vendor", "approve", { id: vendor.id })}
                              className="flex-1 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Approve Vendor
                            </button>
                            <button
                              onClick={() => handleStoreUpdate("vendor", "reject", { id: vendor.id })}
                              className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-0.5"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tab 5: Wedding Template Management */}
              {activeTab === "templates" && (
                <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                      <Image className="w-5 h-5 text-blue-600" /> Card & STD Templates Core
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Define, monitor, or activate pre-designed Invitation card and Save The Date templates.</p>
                  </div>

                  {/* STD Templates */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">Save The Date Templates ({stats.saveTheDateUsage} usages)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {storeData.templates_save_the_date.map((temp: any) => (
                        <div key={temp.id} className="border border-gray-100 bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 text-xs">{temp.name}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Theme: {temp.theme} • {temp.usage} times used</p>
                          </div>
                          <button
                            onClick={() => handleStoreUpdate("template", "active", { id: temp.id, templateType: "save-the-date", active: !temp.active })}
                            className={`px-3 py-1 text-[9px] font-bold uppercase rounded-lg shadow-sm ${
                              temp.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {temp.active ? "Active" : "Disabled"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wedding Invitation Card Templates */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">Wedding Invitations Card Themes ({stats.invitationUsage} usages)</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {storeData.templates_wedding_invitation.map((temp: any) => (
                        <div key={temp.id} className="border border-gray-100 bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between h-28 hover:border-blue-100 transition-colors">
                          <div>
                            <h4 className="font-bold text-gray-900 text-xs truncate">{temp.name}</h4>
                            <p className="text-[9px] text-gray-400 mt-0.5">Format: {temp.theme}</p>
                            <p className="text-[9px] text-brand-600 font-semibold mt-1">{temp.usage} dynamic usages</p>
                          </div>
                          <button
                            onClick={() => handleStoreUpdate("template", "active", { id: temp.id, templateType: "invitation", active: !temp.active })}
                            className={`w-full py-1 text-[8px] font-extrabold uppercase rounded-md mt-2 ${
                              temp.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {temp.active ? "Published" : "Hidden"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 6: Orders & Bookings Manager */}
              {activeTab === "bookings" && (
                <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-5 h-5 text-purple-600" /> Orders & Bookings Manager
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Verify wedding stage bookings, catering orders, and platform commission sums.</p>
                  </div>

                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Vendor / Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Commission</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeData.bookings.map((booking: any) => (
                          <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-bold text-gray-800">#{booking.id}</td>
                            <td className="p-3 font-medium text-gray-700">{booking.user}</td>
                            <td className="p-3">
                              <p className="font-bold text-gray-900">{booking.vendor}</p>
                              <p className="text-[10px] text-gray-400 font-semibold">Event: {booking.date}</p>
                            </td>
                            <td className="p-3 font-bold text-gray-900">INR {booking.amount}</td>
                            <td className="p-3 font-bold text-brand-600">INR {booking.commission}</td>
                            <td className="p-3">
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                booking.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {booking.status === "PENDING" && (
                                <button
                                  onClick={() => handleStoreUpdate("booking", "status", { id: booking.id, status: "COMPLETED" })}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded"
                                >
                                  Complete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Tab 7: Revenue & Payout Matrix */}
              {activeTab === "revenue" && (
                <motion.div key="revenue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                      <DollarSign className="w-5 h-5 text-emerald-600" /> Revenue & Payout Ledger
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Platform commissions breakdown, payouts log, and custom commission calculators.</p>
                  </div>

                  {/* Revenue Splits grid */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Matrimony Packages</p>
                      <h4 className="text-xl font-bold text-gray-900 mt-1">INR {stats.premiumUsers * 1999}</h4>
                      <p className="text-[9px] text-emerald-600 font-semibold mt-1">Based on {stats.premiumUsers} active Gold memberships</p>
                    </div>
                    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Vendor Commissions</p>
                      <h4 className="text-xl font-bold text-gray-900 mt-1">INR {stats.totalRevenue - (stats.premiumUsers * 1999)}</h4>
                      <p className="text-[9px] text-emerald-600 font-semibold mt-1">Total booked vendor orders cuts</p>
                    </div>
                    <div className="border border-gray-100 rounded-2xl p-4 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/10">
                      <p className="text-[9px] font-bold text-emerald-100 uppercase">Total Net Earnings</p>
                      <h4 className="text-xl font-extrabold mt-1">INR {stats.totalRevenue}</h4>
                      <p className="text-[9px] text-emerald-100 mt-1">All channels combined</p>
                    </div>
                  </div>

                  {/* Vendor Commission Rates Config */}
                  <div className="border border-gray-100 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-gray-900 mb-3">Custom Deal Commission Rate Editor</h3>
                    <div className="space-y-4">
                      {storeData.vendors.map((vendor: any) => (
                        <div key={vendor.id} className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{vendor.name}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">Category: {vendor.category} • Current: {vendor.commission_rate}% commission</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={vendor.commission_rate}
                              onBlur={(e) => handleStoreUpdate("vendor", "update_commission", { id: vendor.id, commission_rate: parseInt(e.target.value, 10) })}
                              className="w-12 p-1 text-center bg-white border border-gray-200 rounded text-xs focus:outline-none"
                            />
                            <span className="text-xs font-bold text-gray-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 8: Complaints & Report Grid */}
              {activeTab === "reports" && (
                <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 text-red-600" /> Complaints & Member Reports
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Handle user grievances, resolve spam flags, or warn accounts.</p>
                  </div>

                  <div className="space-y-4">
                    {storeData.reports.map((rep: any) => (
                      <div key={rep.id} className="border border-gray-100 rounded-2xl p-5 space-y-3 bg-white shadow-sm hover:border-red-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Complaint #{rep.id} against {rep.reported_user}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Filed by reporter: {rep.reporter} on {rep.date}</p>
                          </div>
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            rep.status === "PENDING" ? "bg-red-100 text-red-800 animate-pulse" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {rep.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="font-bold text-gray-600">Reason:</span> "{rep.reason}"
                        </p>
                        {rep.status === "PENDING" && (
                          <div className="flex gap-2 pt-1 border-t border-gray-50">
                            <button
                              onClick={() => handleStoreUpdate("report", "resolve", { id: rep.id })}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Resolve Complaint
                            </button>
                            <button
                              onClick={() => {
                                const targetId = rep.reported_user_id || (rep.reported_user.match(/id:\s*(\d+)/)?.[1] ? parseInt(rep.reported_user.match(/id:\s*(\d+)/)![1], 10) : null);
                                if (targetId) {
                                  handleVerifyUser(targetId, "reject");
                                } else {
                                  triggerAlert("Reported user ID could not be matched.", "error");
                                }
                              }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-0.5"
                            >
                              <Lock className="w-3 h-3" /> Lock/Deactivate Profile
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tab 9: Subscription Management */}
              {activeTab === "subscriptions" && (
                <motion.div key="subscriptions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                      <CreditCard className="w-5 h-5 text-indigo-600" /> Subscription Plan matrix
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Configure premium plan durations, feature limits, and prices.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-5">
                    {storeData.subscriptions.map((plan: any) => (
                      <div key={plan.id} className="border border-indigo-100 bg-indigo-50/10 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-indigo-900 text-sm">{plan.name}</h4>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xs text-indigo-500 font-bold">INR</span>
                            <span className="text-2xl font-extrabold text-indigo-950">{plan.price}</span>
                            <span className="text-[9px] text-indigo-400 font-bold">/ {plan.duration}</span>
                          </div>
                          <div className="space-y-1.5 pt-3 border-t border-indigo-100/50">
                            <p className="text-[10px] text-gray-600 font-medium flex justify-between">
                              <span>Interest limit:</span>
                              <strong className="text-indigo-950">{plan.interest_limit} requests</strong>
                            </p>
                            <p className="text-[10px] text-gray-600 font-medium flex justify-between">
                              <span>Instant Chatting:</span>
                              <strong className="text-indigo-950">{plan.chat_unlocked ? "Enabled" : "Mutual Only"}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4">
                          <label className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider block">Modify Price (INR)</label>
                          <input
                            type="number"
                            defaultValue={plan.price}
                            onBlur={(e) => handleStoreUpdate("subscription", "update", { id: plan.id, price: parseInt(e.target.value, 10), interest_limit: plan.interest_limit })}
                            className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs text-indigo-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tab 10: CMS & Story sliders */}
              {activeTab === "cms" && (
                <motion.div key="cms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                      <Megaphone className="w-5 h-5 text-cyan-600" /> CMS & Banner Sliders
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Control landing page marketing slogans, faqs lists, and success stories.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-900 block">Platform Marketing Banner Message</label>
                    <textarea
                      value={cmsBanner}
                      onChange={(e) => setCmsBanner(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-gray-50/50"
                      rows={3}
                    />
                    <button
                      onClick={() => handleStoreUpdate("cms", "update", { banner_message: cmsBanner })}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                    >
                      Update Banner CMS
                    </button>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-gray-900">Success Stories Slider Management</h3>
                    <div className="space-y-3">
                      {storeData.cms.stories?.map((st: any) => (
                        <div key={st.id} className="bg-gray-50/50 p-4 border border-gray-100 rounded-xl flex items-start gap-4">
                          <span className="bg-cyan-100 text-cyan-700 font-bold px-2 py-0.5 rounded text-[8px] uppercase">{st.year}</span>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-xs">{st.couple}</h4>
                            <p className="text-[10px] text-gray-500 italic mt-0.5">"{st.story}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ===== BIODATA DOWNLOADS TAB ===== */}
              {activeTab === "biodata" && (
                <motion.div
                  key="biodata"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Biodata Download Control</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Enable or disable biodata PDF downloads platform-wide. Track all user download activity.</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-center">
                      <div className="text-2xl font-bold text-amber-700">{(storeData.biodata_downloads || []).length}</div>
                      <div className="text-xs text-amber-600 font-medium">Total Downloads</div>
                    </div>
                  </div>

                  {/* Toggle card */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${biodataEnabled ? "bg-green-50" : "bg-red-50"}`}>
                        <FileText className={`w-6 h-6 ${biodataEnabled ? "text-green-600" : "text-red-400"}`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Biodata PDF Downloads</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Currently <span className={`font-semibold ${biodataEnabled ? "text-green-600" : "text-red-500"}`}>{biodataEnabled ? "ENABLED" : "DISABLED"}</span> — users {biodataEnabled ? "can" : "cannot"} download their biodata.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !biodataEnabled;
                        setBiodataEnabled(newVal);
                        await handleStoreUpdate("biodata_settings", "update", { enable_download: newVal });
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${biodataEnabled ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}`}
                    >
                      {biodataEnabled ? "Disable Downloads" : "Enable Downloads"}
                    </button>
                  </div>

                  {/* Download log table */}
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Download Activity Log</h3>
                      <span className="text-xs text-gray-400">{(storeData.biodata_downloads || []).length} records</span>
                    </div>
                    {(storeData.biodata_downloads || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Download className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No downloads yet</p>
                        <p className="text-xs mt-1">Download events will appear here once users generate biodatas.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {(storeData.biodata_downloads || []).slice(0, 50).map((dl: any) => (
                          <div key={dl.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                                {dl.user_name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{dl.user_name}</p>
                                <p className="text-[10px] text-gray-400">User ID: {dl.user_id}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500">{dl.downloaded_at}</p>
                              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">PDF Download</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ===== AMBIENT MUSIC TAB ===== */}
              {activeTab === "music" && (
                <motion.div
                  key="music"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <Music className="w-5 h-5 text-purple-600" /> Ambient Music Controls
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Configure global ambient wedding instrumental track settings for the user dashboard.</p>
                    </div>
                  </div>

                  {/* Toggle Card */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${musicEnabled ? "bg-purple-50" : "bg-red-50"}`}>
                        <Music className={`w-6 h-6 ${musicEnabled ? "text-purple-600 animate-pulse" : "text-red-400"}`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Dashboard Ambient Music Player</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Currently <span className={`font-semibold ${musicEnabled ? "text-purple-600" : "text-red-500"}`}>{musicEnabled ? "ENABLED" : "DISABLED"}</span> — background instrumental will play for users if active.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !musicEnabled;
                        setMusicEnabled(newVal);
                        await handleStoreUpdate("music_settings", "update", { enable_music: newVal });
                      }}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] border ${
                        musicEnabled 
                          ? "bg-red-50 text-red-650 hover:bg-red-100 border-red-200" 
                          : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                      }`}
                    >
                      {musicEnabled ? "Disable Ambient Music" : "Enable Ambient Music"}
                    </button>
                  </div>

                  {/* Track Config Section */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Default Background Track Configuration</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* URL input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Default Track URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={defaultTrackUrl}
                            onChange={(e) => setDefaultTrackUrl(e.target.value)}
                            placeholder="e.g. https://www.soundhelix.com/...mp3"
                            className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                          <button
                            onClick={async () => {
                              await handleStoreUpdate("music_settings", "update", { default_track: defaultTrackUrl });
                            }}
                            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* File Upload input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Upload Audio File (MP3/WAV)</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleTrackUpload}
                            disabled={uploadingTrack}
                            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                          />
                          {uploadingTrack && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-semibold text-purple-700">
                              Uploading to media storage...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Simple Audio Preview */}
                    {defaultTrackUrl && (
                      <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl space-y-2 mt-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Track Audio Preview</p>
                        <audio src={defaultTrackUrl} controls className="w-full h-10" />
                        <p className="text-[9px] text-gray-400 break-all font-mono">Source: {defaultTrackUrl}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ===== USER FEEDBACKS TAB ===== */}
              {activeTab === "feedbacks" && (
                <motion.div
                  key="feedbacks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <MessageSquarePlus className="w-5 h-5 text-teal-650" /> User Feedbacks
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Read, review, search, and manage feedback submitted by platform users.</p>
                    </div>
                  </div>

                  {/* Feedback Metrics Summary */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Received", value: feedbackStats.total, icon: MessageSquarePlus, color: "bg-teal-50 text-teal-600" },
                      { label: "Average Experience", value: `${feedbackStats.averageRating || 0} / 5.0`, icon: Star, color: "bg-amber-50 text-amber-500" },
                      { label: "Bug Reports 🐛", value: feedbackStats.bugs, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
                      { label: "Appreciations 💖", value: feedbackStats.appreciations, icon: Heart, color: "bg-pink-50 text-pink-600" },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between animate-fade-in">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                          <h3 className="text-lg font-extrabold text-gray-900 mt-1">{item.value}</h3>
                        </div>
                        <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Search and Filters bar */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:max-w-xs">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name, subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      {/* Filter by Category */}
                      <select
                        value={feedbackCategoryFilter}
                        onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-650 focus:outline-none"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="SUGGESTION">💡 Suggestions</option>
                        <option value="BUG">🐛 Bug Reports</option>
                        <option value="APPRECIATION">💖 Appreciations</option>
                        <option value="OTHER">✨ Others</option>
                      </select>

                      {/* Filter by Rating */}
                      <select
                        value={feedbackRatingFilter}
                        onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-650 focus:outline-none"
                      >
                        <option value="ALL">All Ratings</option>
                        <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value="4">⭐⭐⭐⭐ (4/5)</option>
                        <option value="3">⭐⭐⭐ (3/5)</option>
                        <option value="2">⭐⭐ (2/5)</option>
                        <option value="1">⭐ (1/5)</option>
                      </select>
                    </div>
                  </div>

                  {/* Feedback Logs List */}
                  {loadingFeedbacks ? (
                    <div className="p-10 text-center text-xs text-gray-400 font-semibold bg-white border border-gray-100 rounded-2xl">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-550 mb-2" />
                      Retrieving Feedbacks...
                    </div>
                  ) : feedbacks.length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400 font-medium bg-white border border-gray-100 rounded-2xl">
                      No feedbacks found matching selected filters.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {feedbacks
                        .filter(f => {
                          const nameMatch = `${f.user?.first_name || ""} ${f.user?.last_name || ""}`.toLowerCase().includes(searchQuery.toLowerCase());
                          const subjMatch = f.subject.toLowerCase().includes(searchQuery.toLowerCase());
                          const msgMatch = f.message.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesQuery = nameMatch || subjMatch || msgMatch;

                          const matchesCat = feedbackCategoryFilter === "ALL" || f.category === feedbackCategoryFilter;
                          const matchesRating = feedbackRatingFilter === "ALL" || f.rating === parseInt(feedbackRatingFilter, 10);

                          return matchesQuery && matchesCat && matchesRating;
                        })
                        .map((f) => {
                          let catStyle = "bg-gray-50 text-gray-600 border-gray-200";
                          if (f.category === "BUG") catStyle = "bg-red-50 text-red-755 border-red-100";
                          else if (f.category === "SUGGESTION") catStyle = "bg-amber-50 text-amber-755 border-amber-100";
                          else if (f.category === "APPRECIATION") catStyle = "bg-pink-50 text-pink-700 border-pink-100";

                          return (
                            <motion.div
                              key={f.id}
                              layout
                              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-teal-200/50 transition-all duration-200"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${catStyle}`}>
                                    {f.category}
                                  </span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} className={`w-3 h-3 ${s <= f.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{f.subject}</h4>
                                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-3 leading-relaxed">{f.message}</p>
                                </div>
                              </div>

                              <div className="border-t border-gray-55 pt-3 mt-4 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-gray-800 truncate">
                                    {f.user?.first_name} {f.user?.last_name}
                                  </p>
                                  <p className="text-[9px] text-gray-400 truncate">
                                    {f.user?.location || "Malappuram"} · {new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                  </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => setSelectedFeedback(f)}
                                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-650 border border-gray-200 text-[10px] font-bold rounded-lg transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this feedback log?")) {
                                        handleDeleteFeedback(f.id);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 text-[10px] font-bold rounded-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  )}

                  {/* Feedback Details Modal */}
                  {selectedFeedback && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs" onClick={() => setSelectedFeedback(null)} />
                      <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-gray-150 shadow-2xl relative z-10 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold border bg-teal-50 text-teal-700 border-teal-100">
                              {selectedFeedback.category}
                            </span>
                            <h3 className="font-extrabold text-gray-950 text-sm mt-1">{selectedFeedback.subject}</h3>
                          </div>
                          <button
                            onClick={() => setSelectedFeedback(null)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Rating and Date */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-gray-500">Rating:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${s <= selectedFeedback.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                                ))}
                              </div>
                            </div>
                            <span className="text-gray-400">
                              {new Date(selectedFeedback.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          </div>

                          {/* Message box */}
                          <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl">
                            <p className="text-xs font-bold text-gray-450 uppercase tracking-wider mb-2">Message</p>
                            <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">{selectedFeedback.message}</p>
                          </div>

                          {/* User card info */}
                          <div className="bg-brand-50/20 border border-brand-100/50 p-4 rounded-xl space-y-2">
                            <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">User Details</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-450">Name:</span>
                                <p className="font-semibold text-gray-900">{selectedFeedback.user?.first_name} {selectedFeedback.user?.last_name}</p>
                              </div>
                              <div>
                                <span className="text-gray-450">Location:</span>
                                <p className="font-semibold text-gray-900">{selectedFeedback.user?.location || "N/A"}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-450">Mobile Contact:</span>
                                <p className="font-semibold text-gray-950 select-all">{selectedFeedback.user?.mobile_number}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
                          <button
                            onClick={() => setSelectedFeedback(null)}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-750 text-xs font-bold rounded-lg border border-gray-200"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this feedback log?")) {
                                handleDeleteFeedback(selectedFeedback.id);
                              }
                            }}
                            className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            Delete Log
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab: Admin Profile & Security Settings */}
              {activeTab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-600" /> Admin Account Profile & Security
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Manage your administrator details, security credentials, and system activity profile.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Super Administrator
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Card: Profile Information Form */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                      <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                          <User className="w-4 h-4 text-brand-600" />
                          <h3 className="font-bold text-gray-900 text-sm">Personal Information</h3>
                        </div>

                        {/* Avatar Image Picker */}
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-2xl bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-extrabold text-xl overflow-hidden shrink-0 shadow-xs">
                            {profileForm.avatar_url ? (
                              <img src={profileForm.avatar_url} alt="Admin Avatar" className="w-full h-full object-cover" />
                            ) : (
                              profileForm.first_name?.[0]?.toUpperCase() || "A"
                            )}
                            <label className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100">
                              <Camera className="w-5 h-5 text-white" />
                              <input type="file" accept="image/*" className="hidden" onChange={handleAdminAvatarUpload} />
                            </label>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">Profile Picture</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Upload a new photo (JPG, PNG, WebP)</span>
                            <label className="inline-block text-[10px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer mt-1">
                              Browse Computer
                              <input type="file" accept="image/*" className="hidden" onChange={handleAdminAvatarUpload} />
                            </label>
                          </div>
                        </div>

                        {/* First & Last Name */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              First Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={profileForm.first_name}
                              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.last_name}
                              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                            />
                          </div>
                        </div>

                        {/* Mobile Number & Email */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Mobile Contact Number
                          </label>
                          <input
                            type="text"
                            value={profileForm.mobile_number}
                            onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="admin@malappuramnikah.com"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-600/10 flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            {savingProfile ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" /> Save Profile Details
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Right Card: Password & Security Form */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                          <Lock className="w-4 h-4 text-brand-600" />
                          <h3 className="font-bold text-gray-900 text-sm">Security & Password Change</h3>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Current Password *
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Enter current password"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            New Password * (Min 6 chars)
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Enter new strong password"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Confirm New Password *
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Confirm new password"
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={changingPassword}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            {changingPassword ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                              </>
                            ) : (
                              <>
                                <KeyRound className="w-4 h-4" /> Update Security Password
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Session Info & Logout Card */}
                      <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-400">Account ID:</span>
                          <span className="font-bold text-gray-800 font-mono">#MN-ADMIN-{adminProfile?.id || 2}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-400">Created On:</span>
                          <span className="font-bold text-gray-800">
                            {adminProfile?.created_at ? new Date(adminProfile.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "Super Admin"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            localStorage.removeItem("mn_token");
                            triggerAlert("Admin logged out successfully.");
                            setTimeout(() => router.push("/admin/login"), 500);
                          }}
                          className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Logout Admin Session
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>

      {/* Admin User Details Inspection Overlay Modal */}
      {inspectUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-150 shadow-2xl relative z-10 flex flex-col my-auto">
            {/* Modal Top Bar */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-gray-900">Admin User Details Inspector</h3>
                <span className="text-xs font-mono text-gray-400">ID: #{inspectUserId}</span>
              </div>
              <button
                onClick={() => {
                  setInspectUserId(null);
                  setInspectUser(null);
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectUserLoading ? (
              <div className="p-16 text-center text-xs text-gray-400 font-semibold space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
                <p>Fetching latest user details directly from database...</p>
              </div>
            ) : !inspectUser ? (
              <div className="p-16 text-center text-xs text-gray-500 font-medium space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
                <p>Failed to retrieve user profile details from database.</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* 1. Header Overview & Badges */}
                {(() => {
                  const details = inspectUser.profile_details || {};
                  const fields = [
                    details.height, details.weight, details.maritalStatus, details.aboutMe,
                    details.religion, details.caste, details.sect,
                    details.education, details.occupation, details.annualIncome,
                    details.familyType, details.fatherOccupation, details.motherOccupation,
                    details.partnerAgeMin, details.partnerReligion, details.partnerEducation,
                    (details.photos && details.photos.length > 0)
                  ];
                  const populated = fields.filter(Boolean).length;
                  const completionPct = Math.round((populated / fields.length) * 100);

                  return (
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-lg space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white shrink-0 overflow-hidden">
                            {details.photos?.[0] ? (
                              <img src={details.photos[0]} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              inspectUser.first_name?.[0]?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{inspectUser.first_name} {inspectUser.last_name}</h2>
                            <p className="text-xs text-gray-300 flex items-center gap-2 mt-0.5">
                              <Phone className="w-3.5 h-3.5" /> {inspectUser.mobile_number}
                              {inspectUser.email && <>• <Mail className="w-3.5 h-3.5" /> {inspectUser.email}</>}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Gender: <span className="text-white capitalize">{inspectUser.gender}</span> • Profile For: <span className="text-white capitalize">{inspectUser.profile_for}</span> • DOB: <span className="text-white">{inspectUser.dob || "N/A"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {inspectUser.status !== "active" ? (
                            <button
                              onClick={async () => {
                                await handleVerifyUser(inspectUser.id, "approve");
                                handleOpenInspectUser(inspectUser.id);
                              }}
                              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" /> Approve Profile
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                await handleVerifyUser(inspectUser.id, "reject");
                                handleOpenInspectUser(inspectUser.id);
                              }}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" /> Deactivate Profile
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              await handleTogglePremium(inspectUser.id);
                              handleOpenInspectUser(inspectUser.id);
                            }}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
                              inspectUser.is_premium
                                ? "bg-amber-400 text-gray-900 hover:bg-amber-300"
                                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                            }`}
                          >
                            <Award className="w-4 h-4" /> {inspectUser.is_premium ? "Active Gold Tier" : "Upgrade Gold"}
                          </button>
                        </div>
                      </div>

                      {/* Status Badges & Dynamic Completion */}
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            inspectUser.status === "active" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            Account: {inspectUser.status === "active" ? "Verified Active" : "Pending Approval"}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            inspectUser.kyc_status === "VERIFIED" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                          }`}>
                            ID KYC: {inspectUser.kyc_status || "NOT_SUBMITTED"}
                          </span>
                        </div>

                        {/* Profile Completion Bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-300">Profile Completion:</span>
                          <div className="w-28 bg-white/20 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${completionPct}%` }} />
                          </div>
                          <span className="text-xs font-extrabold text-emerald-400">{completionPct}%</span>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1">
                        <span>Registration Date: <span className="text-gray-200">{new Date(inspectUser.created_at).toLocaleString()}</span></span>
                        <span>Last Updated: <span className="text-gray-200">{new Date(inspectUser.updated_at).toLocaleString()}</span></span>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Structured Section Grid */}
                <div className="grid md:grid-cols-2 gap-6 text-xs">
                  {/* Basic Details */}
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/50">
                    <h4 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-600" /> Basic Details & Bio
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                      <div><span className="font-semibold text-gray-400">Height:</span> {inspectUser.profile_details?.height || inspectUser.height || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Weight:</span> {inspectUser.profile_details?.weight || inspectUser.weight || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Marital Status:</span> {inspectUser.profile_details?.maritalStatus || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Body Type:</span> {inspectUser.profile_details?.bodyType || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Complexion:</span> {inspectUser.profile_details?.complexion || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Mother Tongue:</span> {inspectUser.profile_details?.motherTongue || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Physical Status:</span> {inspectUser.profile_details?.physicalStatus || "Normal"}</div>
                      <div><span className="font-semibold text-gray-400">Languages:</span> {inspectUser.profile_details?.languagesSpoken?.join(", ") || "N/A"}</div>
                    </div>
                    {inspectUser.profile_details?.aboutMe && (
                      <div className="pt-2 border-t border-gray-200/60">
                        <span className="font-semibold text-gray-400 block mb-1">About Me:</span>
                        <p className="text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200/50 text-[11px] leading-relaxed">{inspectUser.profile_details.aboutMe}</p>
                      </div>
                    )}
                  </div>

                  {/* Religious Information */}
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/50">
                    <h4 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Religious & Cultural Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                      <div><span className="font-semibold text-gray-400">Religion:</span> {inspectUser.profile_details?.religion || "Islam"}</div>
                      <div><span className="font-semibold text-gray-400">Caste / Community:</span> {inspectUser.cast || inspectUser.profile_details?.caste || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Sub-Caste:</span> {inspectUser.profile_details?.subCaste || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Sect:</span> {inspectUser.profile_details?.sect || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Religious Values:</span> {inspectUser.profile_details?.religiousValues || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Horoscope / Star:</span> {inspectUser.profile_details?.horoscope || "N/A"}</div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/50">
                    <h4 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-2 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-brand-600" /> Professional & Education
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                      <div><span className="font-semibold text-gray-400">Highest Education:</span> {inspectUser.profile_details?.education || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Education Detail:</span> {inspectUser.profile_details?.educationDetail || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Occupation:</span> {inspectUser.profile_details?.occupation || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Employed In:</span> {inspectUser.profile_details?.employedIn || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Annual Income:</span> {inspectUser.profile_details?.annualIncome || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Company Name:</span> {inspectUser.profile_details?.companyName || "N/A"}</div>
                    </div>
                  </div>

                  {/* Family & Living Details */}
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/50">
                    <h4 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-2 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-pink-600" /> Family & Living Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                      <div><span className="font-semibold text-gray-400">Family Type:</span> {inspectUser.profile_details?.familyType || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Family Status:</span> {inspectUser.profile_details?.familyStatus || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Father Occupation:</span> {inspectUser.profile_details?.fatherOccupation || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Mother Occupation:</span> {inspectUser.profile_details?.motherOccupation || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Brothers:</span> {inspectUser.profile_details?.brothersCount ?? "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Sisters:</span> {inspectUser.profile_details?.sistersCount ?? "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Ancestral Origin:</span> {inspectUser.profile_details?.ancestralOrigin || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Location:</span> {inspectUser.location || inspectUser.profile_details?.currentCity || "N/A"}</div>
                    </div>
                  </div>

                  {/* Interests, Hobbies & Habits */}
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/50">
                    <h4 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-2 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-500" /> Hobbies & Habits
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                      <div><span className="font-semibold text-gray-400">Dietary Habits:</span> {inspectUser.profile_details?.dietaryHabits || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Drinking Habits:</span> {inspectUser.profile_details?.drinkingHabits || "No"}</div>
                      <div><span className="font-semibold text-gray-400">Smoking Habits:</span> {inspectUser.profile_details?.smokingHabits || "No"}</div>
                      <div><span className="font-semibold text-gray-400">Interests:</span> {inspectUser.profile_details?.interests?.join(", ") || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Hobbies:</span> {inspectUser.profile_details?.hobbies?.join(", ") || "N/A"}</div>
                    </div>
                  </div>

                  {/* Partner Preferences */}
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/50">
                    <h4 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" /> Partner Preferences
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                      <div><span className="font-semibold text-gray-400">Age Range:</span> {inspectUser.profile_details?.partnerAgeMin || 20} - {inspectUser.profile_details?.partnerAgeMax || 35} yrs</div>
                      <div><span className="font-semibold text-gray-400">Height Range:</span> {inspectUser.profile_details?.partnerHeightMin || "N/A"} - {inspectUser.profile_details?.partnerHeightMax || "N/A"}</div>
                      <div><span className="font-semibold text-gray-400">Marital Status:</span> {inspectUser.profile_details?.partnerMaritalStatus || "Any"}</div>
                      <div><span className="font-semibold text-gray-400">Religion:</span> {inspectUser.profile_details?.partnerReligion || "Islam"}</div>
                      <div><span className="font-semibold text-gray-400">Caste / Community:</span> {inspectUser.profile_details?.partnerCaste || "Any"}</div>
                      <div><span className="font-semibold text-gray-400">Education:</span> {inspectUser.profile_details?.partnerEducation || "Any"}</div>
                      <div><span className="font-semibold text-gray-400">Occupation:</span> {inspectUser.profile_details?.partnerOccupation || "Any"}</div>
                      <div><span className="font-semibold text-gray-400">Preferred Location:</span> {inspectUser.profile_details?.partnerLocation || "Any"}</div>
                    </div>
                  </div>
                </div>

                {/* 3. Media & Introductions Section */}
                <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 border-b border-gray-200 pb-2">
                    <Image className="w-4 h-4 text-teal-600" /> Photos & Media Introductions
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Photos Gallery */}
                    <div className="md:col-span-2 space-y-2">
                      <span className="font-semibold text-gray-500 text-xs">Profile Gallery:</span>
                      {(!inspectUser.profile_details?.photos || inspectUser.profile_details.photos.length === 0) ? (
                        <p className="text-gray-400 text-xs italic bg-white p-3 rounded-xl border border-gray-200/50">No photos uploaded by member.</p>
                      ) : (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {inspectUser.profile_details.photos.map((p: string, idx: number) => (
                            <img key={idx} src={p} alt={`Photo ${idx + 1}`} className="w-24 h-24 object-cover rounded-xl border border-gray-200 shrink-0" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Audio & Video Intro */}
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-gray-500 text-xs flex items-center gap-1 mb-1">
                          <Video className="w-3.5 h-3.5 text-red-500" /> Video Intro:
                        </span>
                        {inspectUser.profile_details?.videoIntroUrl || inspectUser.profile_details?.videoUrl ? (
                          <video src={inspectUser.profile_details.videoIntroUrl || inspectUser.profile_details.videoUrl} controls className="w-full rounded-xl max-h-32 bg-black" />
                        ) : (
                          <p className="text-gray-400 text-[11px] italic bg-white p-2.5 rounded-xl border border-gray-200/50">No video intro provided.</p>
                        )}
                      </div>

                      <div>
                        <span className="font-semibold text-gray-500 text-xs flex items-center gap-1 mb-1">
                          <Volume2 className="w-3.5 h-3.5 text-blue-500" /> Voice Intro:
                        </span>
                        {inspectUser.profile_details?.voiceIntroUrl || inspectUser.profile_details?.audioUrl ? (
                          <audio src={inspectUser.profile_details.voiceIntroUrl || inspectUser.profile_details.audioUrl} controls className="w-full" />
                        ) : (
                          <p className="text-gray-400 text-[11px] italic bg-white p-2.5 rounded-xl border border-gray-200/50">No voice intro recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Identity Verification Scans */}
                <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 border-b border-gray-200 pb-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Identity Verification Scans (KYC)
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-gray-400">Document Type:</span>
                      <p className="font-bold text-gray-900 mt-0.5">{inspectUser.kyc_document_type || "N/A"}</p>
                      <span className="font-semibold text-gray-400 block mt-2">Submission Date:</span>
                      <p className="font-medium text-gray-700">{inspectUser.kyc_submitted_at ? new Date(inspectUser.kyc_submitted_at).toLocaleString() : "N/A"}</p>
                      {inspectUser.kyc_rejected_reason && (
                        <div className="mt-2 text-red-700 bg-red-50 p-2 rounded-xl border border-red-100">
                          <span className="font-bold block">Rejection Reason:</span>
                          {inspectUser.kyc_rejected_reason}
                        </div>
                      )}
                    </div>

                    {/* Front Scan */}
                    <div>
                      <span className="font-semibold text-gray-500 block mb-1">Front Document Scan:</span>
                      {inspectUser.kyc_front_url ? (
                        <img src={inspectUser.kyc_front_url} alt="Front Document" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                      ) : (
                        <div className="h-32 bg-white rounded-xl border border-gray-200/60 flex items-center justify-center text-gray-400 text-[11px]">No Front Scan</div>
                      )}
                    </div>

                    {/* Back Scan */}
                    <div>
                      <span className="font-semibold text-gray-500 block mb-1">Back Document Scan:</span>
                      {inspectUser.kyc_back_url ? (
                        <img src={inspectUser.kyc_back_url} alt="Back Document" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                      ) : (
                        <div className="h-32 bg-white rounded-xl border border-gray-200/60 flex items-center justify-center text-gray-400 text-[11px]">No Back Scan</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
