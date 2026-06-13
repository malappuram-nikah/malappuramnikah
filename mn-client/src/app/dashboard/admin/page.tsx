"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, ShieldCheck, Heart, Sparkles,
  DollarSign, ShoppingBag, Calendar, Image, FileText,
  AlertTriangle, CreditCard, LayoutGrid, BarChart3,
  TrendingUp, Download, Plus, Check, X, Search,
  Lock, Unlock, Award, Settings, Layers, Megaphone,
  Briefcase, Star, MapPin, ChevronRight, HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

const LOCATIONS = [
  "Malappuram",
  "Manjeri",
  "Tirur",
  "Perinthalmana",
  "Ponnani",
  "Kondotty",
  "Tirurangadi",
  "Kuttippuram",
  "Valanchery",
  "Nilambur",
  "Kottakkal",
  "Kottakunnu",
  "Thirunavaya",
  "Kadalundi",
  "Vengara",
  "Angadippuram",
  "Edappal",
  "Tanur",
  "Parappanagadi"
];

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
    activity_logs: []
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [newVendorForm, setNewVendorForm] = useState({ name: "", category: "Photography", location: "", contact: "", commission_rate: 10 });
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [cmsBanner, setCmsBanner] = useState("");

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const loadAdminData = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        router.push("/login");
        return;
      }

      // 1. Fetch Stats & Activity Logs
      const statsRes = await fetch("http://localhost:3333/user/admin/stats", {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      if (statsRes.status === 403 || statsRes.status === 401) {
        triggerAlert("Access denied. Admin privileges required.", "error");
        router.push("/dashboard");
        return;
      }

      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Fetch Stateful Store Data
      const storeRes = await fetch("http://localhost:3333/user/admin/store", {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const storeDataJson = await storeRes.json();
      if (storeDataJson.success) {
        setStoreData(storeDataJson.store);
        setCmsBanner(storeDataJson.store.cms.banner_message || "");
      }

      // 3. Fetch Database Users List
      const usersRes = await fetch("http://localhost:3333/user/admin/users", {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setDbUsers(usersData.users);
      }

    } catch (e) {
      console.error("Admin data loading failed:", e);
      triggerAlert("Server communication error.", "error");
    } finally {
      setLoading(false);
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
      const res = await fetch(`http://localhost:3333/user/admin/users/${userId}/verify`, {
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
      const res = await fetch(`http://localhost:3333/user/admin/users/${userId}/toggle-premium`, {
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
      const res = await fetch("http://localhost:3333/user/admin/store/update", {
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
    { id: "reports",       icon: AlertTriangle,  label: "Complaints Grid",     color: "border-red-500/20 text-red-600" },
    { id: "subscriptions", icon: CreditCard,     label: "Premium Plans",       color: "border-indigo-500/20 text-indigo-600" },
    { id: "cms",           icon: Megaphone,      label: "CMS & Story Sliders", color: "border-cyan-500/20 text-cyan-600" }
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
          </div>
        </div>
      </header>

      {/* Key Metric Overview Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Platform Users", value: stats.totalUsers, desc: `${stats.pendingApproval} awaiting approval`, icon: Users, color: "bg-teal-50 text-teal-600" },
          { label: "Premium Subscribers", value: stats.premiumUsers, desc: "Gold & Diamond levels", icon: Award, color: "bg-brand-50 text-brand-600" },
          { label: "Total Gross Revenue", value: `INR ${stats.totalRevenue}`, desc: "Matrimony + Commission", icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
          { label: "Active Vendor Bookings", value: stats.totalBookings, desc: `${stats.pendingBookings} pending execution`, icon: ShoppingBag, color: "bg-purple-50 text-purple-600" }
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
                  onClick={() => { setActiveTab(item.id); setSearchQuery(""); }}
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
                        {[40, 65, 80, 50, 95, 110].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-brand-500/10 hover:bg-brand-500/25 rounded-t-md transition-colors relative group" style={{ height: `${h}px` }}>
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {h} users
                              </div>
                              <div className="w-full bg-brand-600 rounded-t-md absolute bottom-0" style={{ height: "45%" }} />
                            </div>
                            <span className="text-[8px] text-gray-400 font-bold mt-1.5">M{i+1}</span>
                          </div>
                        ))}
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
                      <p className="text-[10px] text-gray-400 mt-0.5">Toggle membership, upgrade premium limit, or delete profiles.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search name, phone, city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                      />
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
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="p-3.5">
                              <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                              <p className="text-[10px] text-gray-400 font-semibold">{user.mobile_number} • {user.location}</p>
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-gray-700 bg-brand-50 px-2 py-0.5 rounded text-[10px]">{user.cast}</span>
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
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                                const userIdMatch = rep.reported_user.match(/id:\s*(\d+)/);
                                if (userIdMatch) {
                                  handleVerifyUser(parseInt(userIdMatch[1], 10), "reject");
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

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
