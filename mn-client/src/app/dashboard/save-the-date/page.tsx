"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Heart, MapPin, Share2, Download, QrCode, Sparkles, 
  Trash2, Upload, ExternalLink, Shield, BarChart3, Eye, Copy, Check, MessageSquare, Cloud, Loader2
} from "lucide-react";

// Templates Configuration
const templates = [
  {
    id: "traditional-emerald",
    name: "Traditional Emerald",
    bgClass: "bg-gradient-to-b from-[#023e3f] to-[#012526] text-[#dfb15b]",
    accentColor: "#dfb15b",
    fontFamily: "font-serif",
    borderColor: "border-[#dfb15b]/30",
    description: "Deep emerald greens with royal gold accents and classic borders."
  },
  {
    id: "royal-gold",
    name: "Crimson Royal",
    bgClass: "bg-gradient-to-b from-[#5c0618] to-[#2d020a] text-[#ffd700]",
    accentColor: "#ffd700",
    fontFamily: "font-serif",
    borderColor: "border-[#ffd700]/30",
    description: "Rich crimson background with radiant gold text for a regal feel."
  },
  {
    id: "minimalist-pastel",
    name: "Minimalist Blush",
    bgClass: "bg-[#FAF5F3] text-[#4A3B32]",
    accentColor: "#8C6A5C",
    fontFamily: "font-sans",
    borderColor: "border-[#8C6A5C]/20",
    description: "Soft warm tones, modern clean layouts, and delicate typography."
  },
  {
    id: "modern-floral",
    name: "Ethereal Garden",
    bgClass: "bg-gradient-to-b from-[#f3f7f4] to-[#e4ede7] text-[#2f4f4f]",
    accentColor: "#4e7c5e",
    fontFamily: "font-serif",
    borderColor: "border-[#4e7c5e]/30",
    description: "Fresh botanic theme with leafy details and elegant lettering."
  }
];

export default function SaveTheDateCreator() {
  const [activeTab, setActiveTab] = useState<"builder" | "admin">("builder");
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [brideName, setBrideName] = useState("Aysha");
  const [groomName, setGroomName] = useState("Faisal");
  const [weddingDate, setWeddingDate] = useState("2026-12-18");
  const [weddingTime, setWeddingTime] = useState("10:30");
  const [venueName, setVenueName] = useState("Grand Royal Auditorium");
  const [venueAddress, setVenueAddress] = useState("Kottakkal, Malappuram, Kerala");
  const [message, setMessage] = useState("Together with our families, we invite you to share in our joy as we begin our new journey.");
  const [couplePhoto, setCouplePhoto] = useState<string>("https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Cloudinary image upload status
  const [isCloudinaryUploading, setIsCloudinaryUploading] = useState(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>("");

  // Countdown calculations
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Admin states
  const [analytics, setAnalytics] = useState({
    totalViews: 348,
    totalShares: 124,
    qrScans: 56,
    activeTemplates: {
      "traditional-emerald": 182,
      "royal-gold": 98,
      "minimalist-pastel": 45,
      "modern-floral": 23
    }
  });

  const [enabledTemplates, setEnabledTemplates] = useState<string[]>(
    templates.map(t => t.id)
  );

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(weddingDate + "T" + weddingTime) - +new Date();
      let timeLeftVal = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeftVal = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      setTimeLeft(timeLeftVal);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [weddingDate, weddingTime]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Snappy instant local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setCouplePhoto(localPreviewUrl);
    setIsCloudinaryUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default"); 
      
      const response = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCouplePhoto(data.secure_url);
        setCloudinaryUrl(data.secure_url);
      } else {
        // Fallback to local base64 if Cloudinary upload preset is unavailable offline
        const reader = new FileReader();
        reader.onloadend = () => {
          setCouplePhoto(reader.result as string);
          setCloudinaryUrl("Base64 Local Storage (Demo Mode)");
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to local base64 preview:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCouplePhoto(reader.result as string);
        setCloudinaryUrl("Base64 Local Storage (Fallback)");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCloudinaryUploading(false);
    }
  };

  // Build dynamic share link serialization
  const shareLink = `http://localhost:3000/save-the-date/demo-user-invitation?template=${selectedTemplate.id}&bride=${encodeURIComponent(brideName)}&groom=${encodeURIComponent(groomName)}&date=${weddingDate}&time=${weddingTime}&venue=${encodeURIComponent(venueName)}&address=${encodeURIComponent(venueAddress)}&msg=${encodeURIComponent(message)}&photo=${encodeURIComponent(couplePhoto)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("Invitation layout prepared! Image download starting...");
      // Simulate real download
      const link = document.createElement("a");
      link.href = couplePhoto;
      link.download = `SaveTheDate_${brideName}_${groomName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            Save The Date Designer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, manage, and share beautifully designed digital wedding cards & countdown pages.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 self-start">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "builder"
                ? "bg-white text-brand-700 shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Invitation Builder
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "admin"
                ? "bg-white text-brand-700 shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin & Analytics
          </button>
        </div>
      </div>

      {activeTab === "builder" ? (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Builder Form (Left Pane) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Event Details</h2>
            
            {/* Couple names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bride&apos;s Name</label>
                <input 
                  type="text" 
                  value={brideName} 
                  onChange={(e) => setBrideName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Groom&apos;s Name</label>
                <input 
                  type="text" 
                  value={groomName} 
                  onChange={(e) => setGroomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Wedding Date</label>
                <input 
                  type="date" 
                  value={weddingDate} 
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                <input 
                  type="time" 
                  value={weddingTime} 
                  onChange={(e) => setWeddingTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                />
              </div>
            </div>

            {/* Venue & Location */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Venue Name</label>
                <input 
                  type="text" 
                  value={venueName} 
                  placeholder="e.g. Royal Auditorium"
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Detailed Address</label>
                <input 
                  type="text" 
                  value={venueAddress} 
                  placeholder="City, State"
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50"
                />
              </div>
            </div>

            {/* Custom Invitation Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Love Story / Message</label>
              <textarea 
                rows={3}
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-gray-50 resize-none"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Upload Couple Image</label>
              <div className="flex items-center gap-4">
                {couplePhoto && (
                  <img src={couplePhoto} className="w-14 h-14 rounded-xl object-cover border border-gray-200" alt="Preview" />
                )}
                <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Choose Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            {/* Template Chooser */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose Theme Template</label>
              <div className="grid grid-cols-2 gap-3">
                {templates
                  .filter(t => enabledTemplates.includes(t.id))
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedTemplate.id === t.id
                          ? "border-brand-600 bg-brand-50/20"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{t.description}</p>
                    </button>
                  ))}
              </div>
            </div>

            {/* Public Page Share Controls */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-brand-600" /> Share Invitation
              </h3>
              
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-brand-600" /> Copied Link
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-400" /> Copy Share Link
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowQr(!showQr)}
                  className="px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code Preview Popover */}
              {showQr && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col items-center justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    {/* Simulated QR Code using styling */}
                    <div className="w-32 h-32 bg-[radial-gradient(circle_at_2px_2px,black_1px,transparent_0)] bg-[size:6px_6px] relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-4 border-black" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-4 border-black" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-black" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 text-center">Scan to open mobile invitation page</p>
                </div>
              )}

              {/* WhatsApp direct share */}
              <a 
                href={`https://api.whatsapp.com/send?text=Save the Date! ${brideName} 💖 ${groomName} on ${weddingDate}. View invitation card here: ${shareLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-brand-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" /> Share on WhatsApp
              </a>
            </div>
          </div>

          {/* Invitation Real-time Live Preview (Right Pane) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Digital Invitation Preview</span>
              <button 
                onClick={triggerDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-100 text-brand-700 hover:bg-brand-100 text-xs font-semibold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? "Preparing Layout..." : "Export as Card"}
              </button>
            </div>

            {/* Mobile invitation preview frame */}
            <div className="w-full max-w-sm rounded-[2.5rem] border-8 border-gray-900 bg-gray-900 aspect-[9/19] overflow-hidden shadow-2xl relative">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-12 h-1.5 bg-gray-800 rounded-full" />
              </div>

              {/* Inner preview contents */}
              <div className={`w-full h-full overflow-y-auto ${selectedTemplate.bgClass} py-12 px-6 flex flex-col justify-between relative`}>
                
                {/* Vintage Frame borders */}
                <div className={`absolute inset-4 border-2 ${selectedTemplate.borderColor} pointer-events-none rounded-xl`} />
                <div className={`absolute inset-5 border border-dashed ${selectedTemplate.borderColor} pointer-events-none rounded-lg`} />

                {/* Hero Title */}
                <div className="text-center mt-6 z-10">
                  <span className="text-[10px] uppercase tracking-[0.3em] opacity-80">SAVE THE DATE</span>
                  <div className="flex items-center justify-center gap-2 mt-4 font-serif text-3xl font-playfair font-bold">
                    <span>{brideName}</span>
                    <Heart className="w-5 h-5 fill-current animate-pulse text-red-500" />
                    <span>{groomName}</span>
                  </div>
                  <p className="text-xs italic mt-2 opacity-90">Are getting married</p>
                </div>

                {/* Main Photo Card */}
                {couplePhoto && (
                  <div className="my-6 z-10 px-2 relative">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-md relative">
                      <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover" />
                      {isCloudinaryUploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white text-xs gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                          <span>Uploading to Cloudinary...</span>
                        </div>
                      )}
                    </div>
                    {/* Cloudinary Status tag */}
                    <div className="absolute -bottom-2 right-4 bg-black/75 backdrop-blur-md text-white text-[8px] px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                      <Cloud className="w-2.5 h-2.5 text-brand-400" />
                      {isCloudinaryUploading ? "Uploading..." : cloudinaryUrl ? "Stored on Cloudinary" : "Ready to Store"}
                    </div>
                  </div>
                )}

                {/* Countdown Timer */}
                <div className="text-center z-10 my-4 bg-black/10 backdrop-blur-md rounded-2xl py-3 px-4 border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider mb-2 opacity-80">COUNTDOWN TO BIG DAY</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { value: timeLeft.days, label: "Days" },
                      { value: timeLeft.hours, label: "Hours" },
                      { value: timeLeft.minutes, label: "Mins" },
                      { value: timeLeft.seconds, label: "Secs" }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="text-lg font-bold font-playfair leading-tight">{item.value.toString().padStart(2, "0")}</div>
                        <div className="text-[8px] uppercase tracking-wider opacity-70 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invitation Story */}
                <div className="text-center px-4 my-2 z-10">
                  <p className="text-xs leading-relaxed italic opacity-95">{message}</p>
                </div>

                {/* Venue Details */}
                <div className="text-center mt-4 mb-2 z-10">
                  <div className="w-8 h-px bg-current opacity-30 mx-auto mb-3" />
                  <p className="text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" /> {venueName}
                  </p>
                  <p className="text-[10px] opacity-80 mt-1">{venueAddress}</p>
                  <p className="text-xs mt-3 font-semibold tracking-wider">
                    {weddingDate ? new Date(weddingDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""}
                  </p>
                </div>

                {/* Google Maps link simulator */}
                <div className="text-center z-10 mt-2">
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest border border-current/20 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Get Location Map
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center max-w-xs">
              Live invitation updates instantly as you edit the fields. Use &quot;Share Link&quot; to view on web.
            </p>
          </div>
        </div>
      ) : (
        /* Admin Features & Analytics (Right Pane Tab) */
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { label: "Total Card Views", value: analytics.totalViews, desc: "Across all generated pages", icon: Eye },
              { label: "Direct Shares", value: analytics.totalShares, desc: "Via WhatsApp and copy links", icon: Share2 },
              { label: "QR Code Scans", value: analytics.qrScans, desc: "From prints & offline scans", icon: QrCode }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className="w-5 h-5 text-brand-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 font-playfair">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Manage Templates */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                Templates Status & Management
              </h3>
              <p className="text-xs text-gray-500">Enable or disable digital templates platform-wide for matching couples.</p>

              <div className="space-y-3 pt-2">
                {templates.map(t => {
                  const isEnabled = enabledTemplates.includes(t.id);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{t.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Used by {analytics.activeTemplates[t.id as keyof typeof analytics.activeTemplates] || 0} couples</p>
                      </div>
                      <button
                        onClick={() => {
                          if (isEnabled) {
                            setEnabledTemplates(enabledTemplates.filter(id => id !== t.id));
                          } else {
                            setEnabledTemplates([...enabledTemplates, t.id]);
                          }
                        }}
                        className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors ${
                          isEnabled
                            ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template Popularity Graph */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-600" />
                Theme Popularity
              </h3>
              <p className="text-xs text-gray-500">Distribution of designs selected by platform users.</p>

              <div className="space-y-4 pt-4">
                {templates.map(t => {
                  const usage = analytics.activeTemplates[t.id as keyof typeof analytics.activeTemplates] || 0;
                  const maxUsage = Math.max(...Object.values(analytics.activeTemplates));
                  const percent = maxUsage > 0 ? (usage / maxUsage) * 100 : 0;

                  return (
                    <div key={t.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-gray-700">
                        <span>{t.name}</span>
                        <span>{usage} invites</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div 
                          className="h-full bg-brand-600 rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
