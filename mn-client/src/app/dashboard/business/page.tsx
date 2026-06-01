"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Star, MessageSquare, DollarSign, Image,
  Sparkles, Calendar, TrendingUp, Download, Play,
  Plus, Check, X, Search, ShieldCheck, Clock,
  Eye, Settings, Layers, Send, ChevronRight, User
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function WeddingBusinessDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("creators");
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // State for loaded B2B Wedding store
  const [storeData, setStoreData] = useState<any>({
    vendors: [],
    bookings: [],
    templates_save_the_date: [],
    templates_wedding_invitation: [],
    activity_logs: []
  });

  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    vendorRevenue: 0,
    saveTheDateUsage: 0,
    invitationUsage: 0
  });

  // Creator-Client Chat workspace states
  const [selectedChat, setSelectedChat] = useState<number>(1);
  const [chatMessage, setChatMessage] = useState("");
  const [chats, setChats] = useState<any[]>([
    {
      id: 1,
      creator: "Zara Photography",
      category: "Photography",
      client: "Sinan",
      lastMsg: "I will send the finalized wedding album layouts by tomorrow evening.",
      time: "2 mins ago",
      messages: [
        { sender: "client", text: "Salam, do you provide drone coverage for the outdoor Mehendi function?", time: "10:14 AM" },
        { sender: "creator", text: "Walaikum Assalam! Yes, our Premium Gold package includes complete 4K drone shoots for both Mehendi and Nikah.", time: "10:18 AM" },
        { sender: "client", text: "Great, please block June 15th for our event. I will finalize the booking deposit today.", time: "10:25 AM" },
        { sender: "creator", text: "Perfect! I will send the finalized wedding album layouts by tomorrow evening.", time: "10:27 AM" }
      ]
    },
    {
      id: 2,
      creator: "Kozhikode Caterers",
      category: "Catering",
      client: "Aysha K.",
      lastMsg: "Shall we schedule a food tasting session this Saturday?",
      time: "1 hour ago",
      messages: [
        { sender: "creator", text: "We have finalized the traditional Malabar biryani recipe with custom mutton items.", time: "Yesterday" },
        { sender: "client", text: "That sounds excellent. Make sure the spice levels are moderate, please.", time: "Yesterday" },
        { sender: "creator", text: "Shall we schedule a food tasting session this Saturday?", time: "09:30 AM" }
      ]
    },
    {
      id: 3,
      creator: "Royal Stage Decorators",
      category: "Decoration",
      client: "Fathima R.",
      lastMsg: "Let me check if Emerald green drapes are available for that theme.",
      time: "4 hours ago",
      messages: [
        { sender: "client", text: "Can we replace the artificial roses on the backdrop with real jasmine strings?", time: "08:12 AM" },
        { sender: "creator", text: "Let me check if Emerald green drapes are available for that theme.", time: "08:20 AM" }
      ]
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [newVendorForm, setNewVendorForm] = useState({ name: "", category: "Videographer", location: "", contact: "", commission_rate: 12 });
  const [showAddVendor, setShowAddVendor] = useState(false);

  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const loadBusinessData = async () => {
    try {
      const storedToken = localStorage.getItem("mn_token");
      if (!storedToken) {
        router.push("/login");
        return;
      }

      // Fetch Stats
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

      // Fetch Stateful Store
      const storeRes = await fetch("http://localhost:3333/user/admin/store", {
        headers: { "Authorization": `Bearer ${storedToken}` }
      });
      const storeDataJson = await storeRes.json();
      if (storeDataJson.success) {
        setStoreData(storeDataJson.store);
      }

    } catch (e) {
      console.error("Wedding B2B Hub loading failed:", e);
      triggerAlert("Server communication error.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessData();
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
        triggerAlert("Wedding services database updated successfully!");
        await loadBusinessData();
      }
    } catch (e) {
      triggerAlert("Failed to submit B2B updates.", "error");
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name || !newVendorForm.location) {
      triggerAlert("Please complete all fields.", "error");
      return;
    }
    await handleStoreUpdate("vendor", "create", newVendorForm);
    setNewVendorForm({ name: "", category: "Videographer", location: "", contact: "", commission_rate: 12 });
    setShowAddVendor(false);
  };

  // Simulated Chat Action: Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const updatedChats = chats.map(c => {
      if (c.id === selectedChat) {
        return {
          ...c,
          lastMsg: chatMessage,
          messages: [
            ...c.messages,
            { sender: "creator", text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
      }
      return c;
    });

    setChats(updatedChats);
    setChatMessage("");
    triggerAlert("Response routed to client's chat feed!");
  };

  // B2B Reports Export Action
  const handleExportB2BData = (type: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === "creators") {
      csvContent += "ID,Creator Name,Category,Location,Phone,Commission Rate %,Rating,Status\n";
      storeData.vendors.forEach((v: any) => {
        csvContent += `${v.id},"${v.name}",${v.category},"${v.location}",${v.contact},${v.commission_rate}%,${v.rating},${v.status}\n`;
      });
    } else {
      csvContent += "Booking ID,Customer,Creative Service,Date,Amount (INR),Platform Commission Cut (INR),Status\n";
      storeData.bookings.forEach((b: any) => {
        csvContent += `${b.id},${b.user},"${b.vendor}",${b.date},${b.amount},${b.commission},${b.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WeddingB2B_SuperAdmin_${type}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert("B2B Business Ledger exported!");
  };

  const currentChat = chats.find(c => c.id === selectedChat);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-gray-500">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
          <Sparkles className="w-10 h-10 text-yellow-500" />
        </motion.div>
        <p className="font-semibold mt-4 text-xs text-yellow-100/70 tracking-widest uppercase">Opening B2B Wedding Hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20 pt-6 px-4 sm:px-6 lg:px-8 text-gray-100">
      
      {/* Alert Notification */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${
              alertMsg.type === "success" 
                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" 
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-semibold">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium B2B Header */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500/10 text-yellow-500 text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                B2B Creators Portal
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider">Live Wedding Services Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2 tracking-wide font-serif">
              <Briefcase className="w-7 h-7 text-yellow-500" /> Wedding Services & B2B Hub
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
              Track wedding bookings, coordinate crafters & videographers, verify digital invitation card sales, and review platform commissions.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => handleExportB2BData("creators")}
              className="px-3.5 py-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:border-gray-700 text-yellow-500 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" /> Export Creators List
            </button>
            <button
              onClick={() => handleExportB2BData("revenue")}
              className="px-3.5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-yellow-500/10 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <DollarSign className="w-4 h-4" /> Export B2B Ledger
            </button>
          </div>
        </div>
      </header>

      {/* Wedding Business KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "B2B Gross Billings", value: `INR ${stats.vendorRevenue || 0}`, desc: "Photography catering stage setup", icon: DollarSign, color: "border-yellow-500/20 text-yellow-500 bg-yellow-500/5" },
          { label: "Platform Commissions", value: `INR ${(stats.totalRevenue || 0) - (stats.premiumUsers * 1999 || 0)}`, desc: "10% to 15% platform booking cut", icon: TrendingUp, color: "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" },
          { label: "Save The Date templates sold", value: stats.saveTheDateUsage || 0, desc: " Emerald vintage & Calligraphy", icon: Image, color: "border-blue-500/20 text-blue-500 bg-blue-500/5" },
          { label: "Video Invitation Downloads", value: stats.invitationUsage || 0, desc: "Palace gatefold dynamic themes", icon: Play, color: "border-purple-500/20 text-purple-500 bg-purple-500/5" }
        ].map((item, i) => (
          <div key={i} className={`rounded-2xl p-5 border shadow-2xl flex items-start justify-between hover:border-yellow-500/35 transition-all group ${item.color}`}>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
              <h3 className="text-xl font-extrabold text-white mt-1.5">{item.value}</h3>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">{item.desc}</p>
            </div>
            <div className="p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform bg-gray-900 border border-gray-800">
              <item.icon className="w-4.5 h-4.5" />
            </div>
          </div>
        ))}
      </section>

      {/* Split view: business module switchers */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Side Tab Navigation */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1 shadow-2xl">
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-yellow-500 px-3 mb-3">Business Channels</h2>
            {[
              { id: "creators",     icon: Briefcase,     label: "Creators & Crafters" },
              { id: "chats",        icon: MessageSquare, label: "Creator-Client Chat" },
              { id: "templates",    icon: Image,         label: "STD & Card Templates" },
              { id: "bookings",     icon: Calendar,      label: "B2B Shoot Orders" },
              { id: "commissions",  icon: DollarSign,    label: "Commissions Split" }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-semibold transition-all group border ${
                    isActive 
                      ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-transparent shadow-lg shadow-yellow-500/10 font-bold" 
                      : "text-gray-400 border-transparent hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-black" : "text-gray-500 group-hover:text-yellow-500"
                  }`} />
                  <span className="flex-1">{tab.label}</span>
                  {tab.id === "chats" && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? "bg-black text-yellow-500" : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Creators Growth Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-5 text-gray-300 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all" />
            <h4 className="font-bold text-xs text-yellow-500 tracking-wider">Creator Network Reach</h4>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Average customer satisfaction score for stage designs and photography shoots.</p>
            <div className="flex items-end gap-3 mt-4">
              <div className="text-3xl font-extrabold text-white">4.9 / 5</div>
              <Star className="w-5 h-5 text-yellow-500 fill-current mb-1" />
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-yellow-500 h-full rounded-full" style={{ width: "95%" }} />
            </div>
          </div>
        </aside>

        {/* Right Side Panel */}
        <main className="lg:col-span-9">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-[500px] shadow-2xl">
            <AnimatePresence mode="wait">
              
              {/* Tab 1: Creators & Crafters Coordinator */}
              {activeTab === "creators" && (
                <motion.div key="creators" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white tracking-wide font-serif flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-yellow-500" /> Wedding Creators Directory
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">Approve, add or regulate videographers, custom stage designers, and card decorators.</p>
                    </div>
                    <button
                      onClick={() => setShowAddVendor(!showAddVendor)}
                      className="px-3.5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1 active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5 text-black" /> {showAddVendor ? "Close" : "Add Creator"}
                    </button>
                  </div>

                  {/* Add Creator Form */}
                  <AnimatePresence>
                    {showAddVendor && (
                      <motion.form
                        onSubmit={handleCreateVendor}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-950 border border-gray-850 rounded-2xl p-5 grid sm:grid-cols-2 gap-4"
                      >
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Creator Business Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Red Lens Videography"
                            value={newVendorForm.name}
                            onChange={(e) => setNewVendorForm({...newVendorForm, name: e.target.value})}
                            className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Service Category</label>
                          <select
                            value={newVendorForm.category}
                            onChange={(e) => setNewVendorForm({...newVendorForm, category: e.target.value})}
                            className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                          >
                            {["Videographer", "Photographer", "Stage Crafter", "Catering Service", "Mehndi Artist"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Location / City</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Malappuram, Kerala"
                            value={newVendorForm.location}
                            onChange={(e) => setNewVendorForm({...newVendorForm, location: e.target.value})}
                            className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Contact Number</label>
                          <input
                            type="text"
                            required
                            placeholder="+91 9800000000"
                            value={newVendorForm.contact}
                            onChange={(e) => setNewVendorForm({...newVendorForm, contact: e.target.value})}
                            className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="sm:col-span-2 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98] mt-2"
                        >
                          Register Creative Vendor
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Creators Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {storeData.vendors.map((vendor: any) => (
                      <div key={vendor.id} className="border border-gray-800 bg-gray-950/30 rounded-2xl p-5 shadow-2xl space-y-3.5 hover:border-yellow-500/20 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-sm tracking-wide">{vendor.name}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{vendor.location} • {vendor.contact}</p>
                          </div>
                          <span className={`text-[8px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            vendor.status === "APPROVED" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse"
                          }`}>
                            {vendor.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 text-[10px] bg-gray-900/50 p-2.5 rounded-xl border border-gray-800 text-gray-400">
                          <span className="font-semibold text-center">Category: <br/><strong className="text-white text-xs">{vendor.category}</strong></span>
                          <span className="font-semibold text-center border-x border-gray-800">Cut Rate: <br/><strong className="text-yellow-500 text-xs">{vendor.commission_rate}%</strong></span>
                          <span className="font-semibold text-center flex items-center justify-center gap-0.5">Rating: <br/><strong className="text-white text-xs flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-current inline" /> {vendor.rating}</strong></span>
                        </div>

                        {vendor.status === "PENDING" && (
                          <div className="flex gap-2 pt-1 border-t border-gray-800">
                            <button
                              onClick={() => handleStoreUpdate("vendor", "approve", { id: vendor.id })}
                              className="flex-1 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Approve Business
                            </button>
                            <button
                              onClick={() => handleStoreUpdate("vendor", "reject", { id: vendor.id })}
                              className="flex-1 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-0.5"
                            >
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Creator-Client Chat Workspace */}
              {activeTab === "chats" && (
                <motion.div key="chats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="border-b border-gray-800 pb-4">
                    <h2 className="text-base font-bold text-white tracking-wide font-serif flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-yellow-500" /> B2B Creator-Client Chat Workspace
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Coordinate discussions and monitor requirements between bridal couples and verified stage crafters / video teams.</p>
                  </div>

                  <div className="grid md:grid-cols-12 border border-gray-800 rounded-2xl overflow-hidden h-[420px] bg-gray-950/20 shadow-2xl">
                    {/* Chat selection list */}
                    <div className="md:col-span-4 border-r border-gray-800 overflow-y-auto bg-gray-950/50">
                      {chats.map(chat => (
                        <button
                          key={chat.id}
                          onClick={() => setSelectedChat(chat.id)}
                          className={`w-full p-3.5 border-b border-gray-800/80 text-left transition-all flex items-start gap-2.5 ${
                            selectedChat === chat.id 
                              ? "bg-gray-900 border-l-4 border-l-yellow-500" 
                              : "hover:bg-gray-900/50"
                          }`}
                        >
                          <div className="p-2 rounded-xl bg-gray-800 shrink-0 text-yellow-500 border border-gray-700">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-bold text-xs text-white truncate">{chat.creator}</h4>
                              <span className="text-[8px] text-gray-500 font-semibold">{chat.time}</span>
                            </div>
                            <p className="text-[9px] text-yellow-500/70 font-semibold mt-0.5">{chat.category} • Client: {chat.client}</p>
                            <p className="text-[10px] text-gray-400 truncate mt-1">{chat.lastMsg}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Active Conversation Feed */}
                    <div className="md:col-span-8 flex flex-col justify-between h-full bg-gray-950/20">
                      {currentChat ? (
                        <>
                          {/* Chat Box Header */}
                          <div className="p-3.5 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-xs text-white">{currentChat.creator} & {currentChat.client}</h4>
                              <p className="text-[9px] text-gray-400 mt-0.5">Active thread for wedding service planning</p>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Connection Monitored
                            </span>
                          </div>

                          {/* Message feed */}
                          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[260px] bg-gray-950/30">
                            {currentChat.messages.map((m: any, i: number) => {
                              const isClient = m.sender === "client";
                              return (
                                <div key={i} className={`flex flex-col ${isClient ? "items-start" : "items-end"}`}>
                                  <div className={`p-3 rounded-2xl text-xs max-w-sm border leading-relaxed ${
                                    isClient 
                                      ? "bg-gray-900 text-gray-200 border-gray-800 rounded-tl-none" 
                                      : "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-400 border-yellow-500/20 rounded-tr-none"
                                  }`}>
                                    <p className="font-medium">{m.text}</p>
                                    <span className="text-[8px] text-gray-500 block mt-1 text-right font-bold">{m.time}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Sim message input */}
                          <form onSubmit={handleSendMessage} className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2">
                            <input
                              type="text"
                              placeholder={`Speak on behalf of ${currentChat.creator}...`}
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              className="flex-1 p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-yellow-500"
                            />
                            <button
                              type="submit"
                              className="p-2.5 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-black transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <MessageSquare className="w-8 h-8 mb-2" />
                          <p className="text-xs">Select a creative discussion thread.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Template & Video Library */}
              {activeTab === "templates" && (
                <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="border-b border-gray-800 pb-4">
                    <h2 className="text-base font-bold text-white tracking-wide font-serif flex items-center gap-2">
                      <Image className="w-5 h-5 text-yellow-500" /> Digital Template & Invitation Catalog
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Control live template downloads, dynamic invite video sizes, and track sales revenue.</p>
                  </div>

                  {/* Save The Date */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white border-b border-gray-800 pb-2">STD Calligraphy & Theme Downloads</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {storeData.templates_save_the_date.map((temp: any) => (
                        <div key={temp.id} className="border border-gray-800 bg-gray-950/20 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white text-xs tracking-wide">{temp.name}</h4>
                            <p className="text-[9px] text-gray-400 mt-0.5">Theme: {temp.theme} • {temp.usage} total downloads</p>
                            <p className="text-[10px] text-yellow-500 font-bold mt-1">Est. Revenue: INR {temp.usage * 499}</p>
                          </div>
                          <button
                            onClick={() => handleStoreUpdate("template", "active", { id: temp.id, templateType: "save-the-date", active: !temp.active })}
                            className={`px-3 py-1 text-[9px] font-bold uppercase rounded-lg shadow-sm border ${
                              temp.active 
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" 
                                : "bg-gray-850 text-gray-500 border-gray-800"
                            }`}
                          >
                            {temp.active ? "Live" : "Inactive"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Video Invitations */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white border-b border-gray-800 pb-2">Dynamic Video invitation Templates</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {storeData.templates_wedding_invitation.map((temp: any) => (
                        <div key={temp.id} className="border border-gray-800 bg-gray-950/20 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-32 hover:border-yellow-500/10 transition-all">
                          <div>
                            <h4 className="font-bold text-white text-xs truncate tracking-wide">{temp.name}</h4>
                            <p className="text-[9px] text-gray-400 mt-0.5">Format: {temp.theme}</p>
                            <p className="text-[9px] text-yellow-500 font-bold mt-1">{temp.usage} video generation purchases</p>
                          </div>
                          <button
                            onClick={() => handleStoreUpdate("template", "active", { id: temp.id, templateType: "invitation", active: !temp.active })}
                            className={`w-full py-1.5 text-[8px] font-extrabold uppercase rounded-lg border mt-2 ${
                              temp.active 
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" 
                                : "bg-gray-850 text-gray-500 border-gray-800"
                            }`}
                          >
                            {temp.active ? "Published" : "Draft"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 4: B2B Shoot Orders */}
              {activeTab === "bookings" && (
                <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="border-b border-gray-800 pb-4">
                    <h2 className="text-base font-bold text-white tracking-wide font-serif flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-yellow-500" /> B2B Creative Services Bookings
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Track photographic shoot bookings, custom stage arrangements, and payout cycles.</p>
                  </div>

                  <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/20">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-900/50 text-gray-400 font-bold uppercase border-b border-gray-800">
                          <th className="p-3.5">Booking ID</th>
                          <th className="p-3.5">Brides / Grooms</th>
                          <th className="p-3.5">Creative Vendor</th>
                          <th className="p-3.5">Event Date</th>
                          <th className="p-3.5">Booking Amount</th>
                          <th className="p-3.5 text-right">Commission Cut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeData.bookings.map((booking: any) => (
                          <tr key={booking.id} className="border-b border-gray-800 hover:bg-gray-900/20 transition-colors">
                            <td className="p-3.5 font-bold text-yellow-500">#{booking.id}</td>
                            <td className="p-3.5 font-medium text-gray-200">{booking.user}</td>
                            <td className="p-3.5">
                              <p className="font-bold text-white">{booking.vendor}</p>
                            </td>
                            <td className="p-3.5 text-gray-400 font-medium">{booking.date}</td>
                            <td className="p-3.5 font-bold text-white">INR {booking.amount}</td>
                            <td className="p-3.5 font-bold text-emerald-400 text-right">INR {booking.commission}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Tab 5: Commissions Split */}
              {activeTab === "commissions" && (
                <motion.div key="commissions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="border-b border-gray-800 pb-4">
                    <h2 className="text-base font-bold text-white tracking-wide font-serif flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-500" /> B2B Revenue & Commissions Split
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Monitor total platform cuts and payout distributions to creative vendors.</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="border border-gray-800 rounded-2xl p-4 bg-gray-950/20">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total B2B Billings</p>
                      <h4 className="text-xl font-extrabold text-white mt-1">INR {stats.vendorRevenue || 0}</h4>
                      <p className="text-[9px] text-yellow-500 font-semibold mt-1">Total revenue generated by services</p>
                    </div>
                    <div className="border border-gray-800 rounded-2xl p-4 bg-gray-950/20">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Platform Commissions</p>
                      <h4 className="text-xl font-extrabold text-emerald-400 mt-1">INR {(stats.totalRevenue || 0) - (stats.premiumUsers * 1999 || 0)}</h4>
                      <p className="text-[9px] text-gray-400 font-semibold mt-1">Total platform cuts collected</p>
                    </div>
                    <div className="border border-yellow-500/20 rounded-2xl p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 text-white shadow-xl">
                      <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider">Total Creator Payouts</p>
                      <h4 className="text-xl font-extrabold text-white mt-1">INR {(stats.vendorRevenue || 0) - ((stats.totalRevenue || 0) - (stats.premiumUsers * 1999 || 0))}</h4>
                      <p className="text-[9px] text-yellow-500 font-bold mt-1">Distributed directly to vendors</p>
                    </div>
                  </div>

                  {/* Calculator Widget */}
                  <div className="border border-gray-800 rounded-xl p-5 bg-gray-950/40">
                    <h3 className="text-xs font-bold text-yellow-500 mb-3 tracking-wide">Interactive Commission Estimator</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Estimated Deal Amount (INR)</label>
                        <input
                          type="number"
                          defaultValue={50000}
                          id="estAmount"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const rate = parseInt((document.getElementById("estRate") as HTMLInputElement).value, 10) || 0;
                            (document.getElementById("calcCommission") as HTMLElement).innerText = `INR ${(val * rate / 100).toFixed(0)}`;
                            (document.getElementById("calcPayout") as HTMLElement).innerText = `INR ${(val * (1 - rate / 100)).toFixed(0)}`;
                          }}
                          className="w-full p-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Commission Rate (%)</label>
                        <input
                          type="number"
                          defaultValue={10}
                          id="estRate"
                          onChange={(e) => {
                            const rate = parseInt(e.target.value, 10) || 0;
                            const val = parseInt((document.getElementById("estAmount") as HTMLInputElement).value, 10) || 0;
                            (document.getElementById("calcCommission") as HTMLElement).innerText = `INR ${(val * rate / 100).toFixed(0)}`;
                            (document.getElementById("calcPayout") as HTMLElement).innerText = `INR ${(val * (1 - rate / 100)).toFixed(0)}`;
                          }}
                          className="w-full p-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 grid grid-cols-2 gap-4 pt-3 border-t border-gray-800/80 mt-2 text-center text-xs">
                        <div className="p-3 bg-gray-900 rounded-xl">
                          <p className="text-[9px] text-gray-400 font-bold">EST. PLATFORM COMMISSION</p>
                          <span id="calcCommission" className="text-base font-extrabold text-emerald-400 mt-1 block">INR 5,000</span>
                        </div>
                        <div className="p-3 bg-gray-900 rounded-xl">
                          <p className="text-[9px] text-gray-400 font-bold">EST. CREATOR PAYOUT</p>
                          <span id="calcPayout" className="text-base font-extrabold text-yellow-500 mt-1 block">INR 45,000</span>
                        </div>
                      </div>
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
