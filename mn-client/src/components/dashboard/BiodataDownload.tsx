"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Printer, Share2, X, FileText, CheckCircle2, Lock } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

interface BiodataDownloadProps {
  profile: any;
  /** Optional: raw enriched profile (from getEnrichedProfile). Falls back to raw. */
  enriched?: any;
}

export default function BiodataDownload({ profile, enriched }: BiodataDownloadProps) {
  const [open, setOpen] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [done, setDone] = useState(false);

  // Fetch admin setting on mount
  useEffect(() => {
    fetch(`${API_BASE}/user/admin/biodata/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDownloadEnabled(data.settings?.enable_download !== false);
      })
      .catch(() => {});
  }, []);

  const trackDownload = async () => {
    try {
      const token = localStorage.getItem("mn_token");
      await fetch(`${API_BASE}/user/admin/biodata/track`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
    } catch {}
  };

  /* ---------- Build HTML content ---------- */
  const buildHTML = (forPrint = false) => {
    const d = profile?.profile_details || {};
    const basic = d.mn_basic_details_draft || {};
    const rel = d.mn_religious_info_draft || {};
    const prof = d.mn_professional_info_draft || {};
    const fam = d.mn_family_details_draft || {};
    const interests = d.mn_interests_draft || {};
    const partner = d.mn_partner_preferences_draft || {};

    const e = enriched || {};
    const name = e.name || profile?.name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Member";
    const photo = e.photo || profile?.photo || "";
    const age = e.age || basic.age || "N/A";
    const gender = e.gender || basic.gender || "N/A";
    const location = e.location || basic.presentLocation || "N/A";
    const height = basic.height || "N/A";
    const weight = basic.weight || "N/A";
    const marital = basic.maritalStatus || "N/A";
    const motherTongue = basic.motherTongue || "N/A";
    const languages = basic.languagesSpoken || "N/A";
    const aboutMe = basic.aboutMe || e.aboutMe || "";
    const profileId = e.profileId || `MN-${100000 + (profile?.id || 0)}`;

    const religion = rel.religion || "Islam";
    const community = rel.community || profile?.cast || "N/A";
    const namaz = rel.namaz || "N/A";
    const quran = rel.quranReading || "N/A";
    const religiousness = rel.religiousness || "N/A";

    const education = (prof.education === "Others" && prof.customEducation) ? prof.customEducation : (prof.education || "N/A");
    const institution = prof.educationInstitution || "N/A";
    const profession = prof.profession || "N/A";
    const professionType = prof.professionType || "N/A";
    const income = prof.annualIncome || "N/A";

    const familyType = fam.familyType || "N/A";
    const fatherName = fam.fatherName || "N/A";
    const fatherJob = fam.fatherOccupation || "N/A";
    const motherName = fam.motherName || "N/A";
    const motherJob = fam.motherOccupation || "N/A";
    const siblings = fam.siblingsCount || "N/A";
    const financialStatus = fam.financialStatus || "N/A";

    const interestList = Array.isArray(interests.interests) ? interests.interests.join(", ") : (interests.interests || "N/A");
    const personality = interests.aboutMe || "N/A";

    const prefAge = (partner.minAge && partner.maxAge) ? `${partner.minAge}–${partner.maxAge} Years` : "N/A";
    const prefReligion = partner.religion || "N/A";
    const prefEducation = partner.education || "N/A";
    const prefLocation = Array.isArray(partner.preferredLocations) ? partner.preferredLocations.join(", ") : (partner.preferredLocations || "N/A");
    const prefMarital = partner.maritalStatus || "N/A";
    const prefNamaz = partner.prefNamaz || "N/A";
    const aboutPartner = partner.aboutPartner || "N/A";

    const row = (label: string, value: string) =>
      `<div class="row"><span class="label">${label}</span><span class="value">${value || "N/A"}</span></div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Matrimonial Biodata – ${name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;color:#1a1a2e;background:#fff;line-height:1.6}
  .page{max-width:800px;margin:0 auto;padding:40px 48px}
  /* Header */
  .header{text-align:center;padding-bottom:24px;border-bottom:2px solid #c2410c;margin-bottom:28px}
  .brand{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c2410c;font-weight:600;margin-bottom:6px}
  .main-title{font-family:'Playfair Display',serif;font-size:32px;color:#1a1a2e;letter-spacing:1px}
  .profile-id{font-size:12px;color:#6b7280;margin-top:4px}
  /* Photo + name block */
  .hero{display:flex;align-items:center;gap:28px;background:linear-gradient(135deg,#fff7ed,#fef3c7);border:1px solid #fde68a;border-radius:16px;padding:24px;margin-bottom:28px}
  .avatar{width:110px;height:110px;border-radius:50%;object-fit:cover;border:4px solid #c2410c;flex-shrink:0}
  .avatar-placeholder{width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,#c2410c,#ea580c);display:flex;align-items:center;justify-content:center;color:#fff;font-size:36px;font-weight:700;flex-shrink:0;font-family:'Playfair Display',serif}
  .hero-name{font-family:'Playfair Display',serif;font-size:26px;color:#1a1a2e}
  .hero-sub{font-size:13px;color:#6b7280;margin-top:4px}
  .hero-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .tag{background:#fff;border:1px solid #fed7aa;color:#c2410c;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px}
  /* Sections */
  .section{margin-bottom:24px}
  .section-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
  .section-dot{width:8px;height:8px;border-radius:50%;background:#c2410c;flex-shrink:0}
  .section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c2410c}
  .section-line{flex:1;height:1px;background:#fde68a}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px}
  .row{display:flex;padding:6px 0;border-bottom:1px dashed #f3f4f6}
  .label{font-size:12px;font-weight:600;color:#6b7280;min-width:140px;flex-shrink:0}
  .value{font-size:13px;color:#111827;flex:1}
  .full{grid-column:span 2}
  /* About boxes */
  .about-box{background:#fffbeb;border-left:4px solid #c2410c;border-radius:8px;padding:14px 16px;font-size:13px;color:#451a03;font-style:italic;line-height:1.7}
  /* Footer */
  .footer{margin-top:36px;padding-top:20px;border-top:1px solid #f3f4f6;text-align:center;font-size:11px;color:#9ca3af}
  .footer-brand{font-size:13px;font-weight:700;color:#c2410c;font-family:'Playfair Display',serif}
  /* No-print actions */
  .actions{position:fixed;top:20px;right:20px;display:flex;gap:10px;z-index:999}
  .btn{padding:10px 18px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s}
  .btn-primary{background:#c2410c;color:#fff}
  .btn-secondary{background:#fff;border:1px solid #e5e7eb;color:#374151}
  @media print{.actions{display:none}body{padding:0}.page{padding:24px 32px}}
  @page{margin:15mm;size:A4}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">Malappuram Nikah</div>
    <div class="main-title">Matrimonial Biodata</div>
    <div class="profile-id">Profile ID: ${profileId} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
  </div>

  <!-- Hero -->
  <div class="hero">
    ${photo ? `<img class="avatar" src="${photo}" alt="${name}"/>` : `<div class="avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`}
    <div>
      <div class="hero-name">${name}</div>
      <div class="hero-sub">${age} yrs &nbsp;·&nbsp; ${gender} &nbsp;·&nbsp; ${location}</div>
      <div class="hero-tags">
        <span class="tag">${religion}</span>
        <span class="tag">${community}</span>
        <span class="tag">${marital}</span>
        <span class="tag">${education}</span>
      </div>
    </div>
  </div>

  <!-- Personal -->
  <div class="section">
    <div class="section-header"><div class="section-dot"></div><div class="section-title">Personal Details</div><div class="section-line"></div></div>
    <div class="grid">
      ${row("Full Name", name)}
      ${row("Age", `${age} Years`)}
      ${row("Gender", gender)}
      ${row("Marital Status", marital)}
      ${row("Height", height)}
      ${row("Weight", weight)}
      ${row("Mother Tongue", motherTongue)}
      ${row("Languages", languages)}
      ${row("Present Location", location)}
    </div>
  </div>

  <!-- Religious -->
  <div class="section">
    <div class="section-header"><div class="section-dot"></div><div class="section-title">Religious Background</div><div class="section-line"></div></div>
    <div class="grid">
      ${row("Religion", religion)}
      ${row("Community / Sect", community)}
      ${row("Religiousness", religiousness)}
      ${row("Namaz Habits", namaz)}
      ${row("Quran Reading", quran)}
    </div>
  </div>

  <!-- Professional -->
  <div class="section">
    <div class="section-header"><div class="section-dot"></div><div class="section-title">Education & Career</div><div class="section-line"></div></div>
    <div class="grid">
      ${row("Education", education)}
      ${row("Institution", institution)}
      ${row("Profession Type", professionType)}
      ${row("Profession", profession)}
      ${row("Annual Income", income)}
    </div>
  </div>

  <!-- Family -->
  <div class="section">
    <div class="section-header"><div class="section-dot"></div><div class="section-title">Family Details</div><div class="section-line"></div></div>
    <div class="grid">
      ${row("Family Type", familyType)}
      ${row("Financial Status", financialStatus)}
      ${row("Father's Name", fatherName)}
      ${row("Father's Occupation", fatherJob)}
      ${row("Mother's Name", motherName)}
      ${row("Mother's Occupation", motherJob)}
      ${row("Siblings", siblings)}
    </div>
  </div>

  <!-- Interests -->
  <div class="section">
    <div class="section-header"><div class="section-dot"></div><div class="section-title">Interests & Personality</div><div class="section-line"></div></div>
    <div class="grid">
      <div class="row full"><span class="label">Interests</span><span class="value">${interestList}</span></div>
    </div>
    ${personality !== "N/A" ? `<div class="about-box" style="margin-top:10px">${personality}</div>` : ""}
  </div>

  <!-- About Me -->
  ${aboutMe ? `<div class="section">
    <div class="section-header"><div class="section-dot"></div><div class="section-title">About Me</div><div class="section-line"></div></div>
    <div class="about-box">${aboutMe}</div>
  </div>` : ""}

  <!-- Partner Preferences -->
  <div class="section">
    <div class="section-header"><div class="section-dot"></div><div class="section-title">Partner Preferences</div><div class="section-line"></div></div>
    <div class="grid">
      ${row("Age Range", prefAge)}
      ${row("Marital Status", prefMarital)}
      ${row("Religion", prefReligion)}
      ${row("Education", prefEducation)}
      ${row("Preferred Namaz", prefNamaz)}
      ${row("Preferred Locations", prefLocation)}
    </div>
    ${aboutPartner !== "N/A" ? `<div class="about-box" style="margin-top:10px">${aboutPartner}</div>` : ""}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">Malappuram Nikah</div>
    <div style="margin-top:4px">Malappuram's Most Trusted Pious Muslim Matrimony Platform</div>
    <div style="margin-top:2px">This biodata is confidential and shared for matrimonial purposes only.</div>
  </div>

</div>
${forPrint ? `<div class="actions no-print">
  <button class="btn btn-primary" onclick="window.print()">🖨 Print</button>
  <button class="btn btn-secondary" onclick="window.close()">Close</button>
</div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));<\/script>` : ""}
</body>
</html>`;
  };

  const openPrintWindow = async () => {
    if (!downloadEnabled) return;
    setIsGenerating(true);
    await trackDownload();

    const html = buildHTML(true);
    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
    }

    setIsGenerating(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const downloadHTML = async () => {
    if (!downloadEnabled) return;
    setIsGenerating(true);
    await trackDownload();

    const html = buildHTML(false);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (profile?.first_name || "biodata").toLowerCase().replace(/\s+/g, "_");
    a.download = `${safeName}_biodata.html`;
    a.click();
    URL.revokeObjectURL(url);

    setIsGenerating(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const handleShare = async () => {
    if (!downloadEnabled) return;
    const html = buildHTML(false);
    const blob = new Blob([html], { type: "text/html" });
    const file = new File([blob], "biodata.html", { type: "text/html" });
    const name = profile?.first_name || "Biodata";

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `${name} – Matrimonial Biodata`, files: [file] });
        await trackDownload();
      } else {
        // Fallback: open print window for manual save
        await openPrintWindow();
      }
    } catch {}
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 hover:bg-amber-100 text-sm font-semibold rounded-xl border border-amber-200 transition-all active:scale-[0.98]"
      >
        <FileText className="w-4 h-4" />
        Biodata PDF
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Download Biodata</h3>
                    <p className="text-xs text-gray-500">Professional matrimonial biodata</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {!downloadEnabled ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                      <Lock className="w-7 h-7 text-red-500" />
                    </div>
                    <p className="font-semibold text-gray-800">Downloads Disabled</p>
                    <p className="text-sm text-gray-500">The administrator has temporarily disabled biodata downloads. Please check back later.</p>
                  </div>
                ) : done ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    </div>
                    <p className="font-semibold text-gray-800">Done!</p>
                    <p className="text-sm text-gray-500">Your biodata has been generated successfully.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Generate a clean, professional biodata PDF for <span className="font-semibold text-gray-800">{profile?.first_name || "this profile"}</span> that includes all sections, platform branding, and is formatted for printing or digital sharing.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-4 space-y-1 text-xs text-gray-500">
                      <p className="font-semibold text-gray-700 mb-2">Included in Biodata:</p>
                      {["Personal Details", "Religious Background", "Education & Career", "Family Details", "Interests & Personality", "Partner Preferences"].map(s => (
                        <div key={s} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {s}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={openPrintWindow}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-2 py-4 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60"
                      >
                        <Printer className="w-5 h-5" />
                        <span className="text-xs font-semibold">Print / PDF</span>
                      </button>
                      <button
                        onClick={downloadHTML}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-2 py-4 px-3 bg-gray-800 hover:bg-gray-900 text-white rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60"
                      >
                        <Download className="w-5 h-5" />
                        <span className="text-xs font-semibold">Download</span>
                      </button>
                      <button
                        onClick={handleShare}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-2 py-4 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60"
                      >
                        <Share2 className="w-5 h-5" />
                        <span className="text-xs font-semibold">Share</span>
                      </button>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                      Use <strong>Print</strong> → Save as PDF in your browser for best results.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
