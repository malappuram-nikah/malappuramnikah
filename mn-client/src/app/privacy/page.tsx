"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, UserCheck, AlertCircle, Mail, Phone, MapPin, Globe, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  const [lang, setLang] = useState<"en" | "ml">("en");

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === "en" ? "bg-brand-600 text-white shadow-xs" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("ml")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              lang === "ml" ? "bg-brand-600 text-white shadow-xs" : "text-gray-600 hover:text-brand-600"
            }`}
          >
            മലയാളം
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-8">
        {/* Header */}
        <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair tracking-tight">
                {lang === "en" ? "Privacy Policy" : "സ്വകാര്യതാ നയം"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {lang === "en"
                  ? "Compliant with India's Digital Personal Data Protection (DPDP) Act, 2023"
                  : "ഡിജിറ്റൽ വ്യക്തിഗത വിവര സംരക്ഷണ (DPDP) നിയമം 2023 അനുസൃതമായി"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start sm:self-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            DPDP Act 2023 Verified
          </span>
        </div>

        {lang === "en" ? (
          /* ENGLISH CONTENT */
          <div className="space-y-8 text-xs sm:text-sm text-gray-600 leading-relaxed">
            {/* Notice Preamble */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Statutory Notice under Section 5 of the DPDP Act, 2023
              </p>
              <p className="text-amber-800 leading-normal">
                This Privacy Notice informs you about the categories of personal data collected by <strong>Malappuram Nikah</strong>, the lawful purpose of processing, how you may exercise your Data Principal rights, and how to contact our Grievance Officer.
              </p>
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">1</span>
                Data We Collect & Purpose of Processing
              </h2>
              <p>We only collect personal data necessary to provide trusted matrimonial matchmaking services:</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">A. Account & Contact Details</span>
                  <p className="text-[11px] text-gray-600">Full Name, Phone Number, Email, Date of Birth, Gender. Used for account creation, OTP authentication, and age verification (18+).</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">B. Matrimony Profile & Preferences</span>
                  <p className="text-[11px] text-gray-600">Marital status, education, profession, family background, sect/caste preferences, and photos to generate matching partner recommendations.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">C. Government ID Verification (KYC)</span>
                  <p className="text-[11px] text-gray-600">Aadhaar, Passport, or Driving License proofs uploaded solely for admin validation to prevent fraudulent/fake profiles.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">D. Communications & Interests</span>
                  <p className="text-[11px] text-gray-600">Shortlists, interest requests, and direct chat messages (strictly unlocked only upon mutual consent of both parties).</p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">2</span>
                Immediate Deletion of ID Cards (Data Minimisation)
              </h2>
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs sm:text-sm">
                  <Trash2 className="w-4 h-4 text-emerald-700" />
                  Automatic ID Proof Purge Policy
                </div>
                <p className="text-xs text-emerald-800 leading-normal">
                  In strict compliance with the <strong>Data Minimisation principle of the DPDP Act 2023</strong>, once our admin team verifies or rejects your submitted identity document (Aadhaar/Passport/Driving License), the raw image files are <strong>permanently deleted from our servers and cloud storage</strong>. Only the verified badge status and verification timestamp are retained on your account.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">3</span>
                Privacy Controls & Mutual Consent
              </h2>
              <ul className="space-y-2 list-disc list-inside text-xs text-gray-600">
                <li><strong className="text-gray-900">Protected Contact Information:</strong> Your mobile number and email address are never displayed publicly. They are only disclosed when you explicitly accept a mutual connection.</li>
                <li><strong className="text-gray-900">Photo Privacy:</strong> You can choose to blur or restrict photo visibility in your profile settings.</li>
                <li><strong className="text-gray-900">Search Visibility:</strong> You have the option to pause or hide your profile from search results at any time.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">4</span>
                Your Rights as a Data Principal (DPDP Act 2023)
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 border border-gray-150 rounded-xl">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5 mb-1">
                    <Eye className="w-3.5 h-3.5 text-brand-600" /> Right to Access (Sec 11)
                  </div>
                  <p className="text-[11px] text-gray-500">You can download a summary of all personal data held about you from your Settings page.</p>
                </div>
                <div className="p-3 border border-gray-150 rounded-xl">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-brand-600" /> Right to Correction & Erasure (Sec 12)
                  </div>
                  <p className="text-[11px] text-gray-500">You can modify your profile details anytime or permanently delete your account and associated data.</p>
                </div>
                <div className="p-3 border border-gray-150 rounded-xl">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-brand-600" /> Right to Withdraw Consent (Sec 6)
                  </div>
                  <p className="text-[11px] text-gray-500">You may withdraw your consent for profile listing or matchmaking processing at any time.</p>
                </div>
                <div className="p-3 border border-gray-150 rounded-xl">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-brand-600" /> Right to Grievance Redressal (Sec 13)
                  </div>
                  <p className="text-[11px] text-gray-500">You can raise complaints directly to our designated Grievance Officer.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">5</span>
                Protection of Children's Data (Section 9)
              </h2>
              <p className="text-xs text-gray-600">
                Malappuram Nikah is strictly intended for individuals who have reached the legal age of marriage (18+ for females, 21+ for males under Indian Law). We do not knowingly collect, track, or process personal data of minors. Accounts attempting to represent minors are permanently barred.
              </p>
            </section>

            {/* Section 6 - Grievance Officer */}
            <section className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">6</span>
                Designated Grievance Officer & Contact
              </h2>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                <p className="text-xs text-gray-600">
                  If you have any questions, concerns, or requests regarding your personal data or wish to exercise your statutory rights under the DPDP Act, please reach out to our Data Grievance Redressal Officer:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-gray-800">
                    <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                    <span><strong>Email:</strong> grievance@malappuramnikah.com</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-800">
                    <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                    <span><strong>Phone:</strong> +91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-800">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    <span><strong>Office:</strong> Malappuram, Kerala, India</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-800">
                    <Globe className="w-4 h-4 text-brand-600 shrink-0" />
                    <span><strong>Response Time:</strong> Within 72 Business Hours</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* MALAYALAM CONTENT */
          <div className="space-y-8 text-xs sm:text-sm text-gray-600 leading-relaxed">
            {/* Notice Preamble */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                DPDP നിയമം 2023 പ്രകാരമുള്ള നിയമപരമായ അറിയിപ്പ്
              </p>
              <p className="text-amber-800 leading-normal">
                <strong>മലപ്പുറം നിക്കാഹ്</strong> പ്ലാറ്റ്‌ഫോം ശേഖരിക്കുന്ന വിവരങ്ങൾ, ഉപയോഗിക്കുന്ന ഉദ്ദേശ്യം, നിങ്ങളുടെ ഡാറ്റാ അവകാശങ്ങൾ, പരാതി പരിഹാര ഉദ്യോഗസ്ഥനെ ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ എന്നിവ ഇതിൽ വ്യക്തമാക്കുന്നു.
              </p>
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">1</span>
                ശേഖരിക്കുന്ന വിവരങ്ങളും ഉദ്ദേശ്യവും
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">A. അക്കൗണ്ട് വിവരങ്ങൾ</span>
                  <p className="text-[11px] text-gray-600">പേര്, ഫോൺ നമ്പർ, ഇമെയിൽ, ജനനത്തീയതി, ലിംഗഭേദം. ഒടിപി പരിശോധനയ്ക്കും പ്രായപരിശോധനയ്ക്കും (18+) ഉപയോഗിക്കുന്നു.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">B. വൈവാഹിക പ്രൊഫൈൽ വിവരങ്ങൾ</span>
                  <p className="text-[11px] text-gray-600">വിദ്യാഭ്യാസം, ജോലി, കുടുംബ പശ്ചാത്തലം, മുൻഗണനകൾ, ഫോട്ടോകൾ എന്നിവ അനുയോജ്യമായ ആലോചനകൾ കണ്ടെത്താൻ ഉപയോഗിക്കുന്നു.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">C. തിരിച്ചറിയൽ കാർഡ് പരിശോധന (KYC)</span>
                  <p className="text-[11px] text-gray-600">വ്യാജ പ്രൊഫൈലുകൾ തടയാൻ ആധാർ / പാസ്‌പോർട്ട് / ഡ്രൈവിംഗ് ലൈസൻസ് തുടങ്ങിയ സർക്കാർ രേഖകൾ പരിശോധിക്കുന്നു.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                  <span className="font-bold text-gray-900 block text-xs">D. ചാറ്റുകളും താല്പര്യങ്ങളും</span>
                  <p className="text-[11px] text-gray-600">പരസ്പര സമ്മതത്തോടെ (Mutual Interest) മാത്രം ഫോൺ നമ്പറുകളും സന്ദേശങ്ങളും കൈമാറുന്നു.</p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">2</span>
                തിരിച്ചറിയൽ കാർഡുകൾ പരിശോധനയ്ക്ക് ശേഷം നീക്കം ചെയ്യുന്നു (Data Minimisation)
              </h2>
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs sm:text-sm">
                  <Trash2 className="w-4 h-4 text-emerald-700" />
                  ഐഡി കാർഡ് സ്ഥിരമായി ഡിലീറ്റ് ചെയ്യുന്ന നയം
                </div>
                <p className="text-xs text-emerald-800 leading-normal">
                  <strong>DPDP Act 2023</strong> ഡാറ്റാ മിനിമൈസേഷൻ നിയമപ്രകാരം, അഡ്മിൻ തിരിച്ചറിയൽ രേഖ പരിശോധിച്ച് ഉറപ്പുവരുത്തിയ ഉടൻ തന്നെ, സമർപ്പിച്ച ഐഡി ഫോട്ടോകൾ ഞങ്ങളുടെ സെർവറുകളിൽ നിന്നും ക്ലൗഡ് സ്റ്റോറേജിൽ നിന്നും <strong>പൂർണ്ണമായി ഡിലീറ്റ് ചെയ്യപ്പെടുന്നു</strong>. അക്കൗണ്ടിൽ &apos;ID Verified&apos; ബാഡ്ജ് മാത്രം നിലനിർത്തുന്നു.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">3</span>
                ഉപയോക്താവിന്റെ നിയന്ത്രണങ്ങൾ (Privacy Controls)
              </h2>
              <ul className="space-y-2 list-disc list-inside text-xs text-gray-600">
                <li><strong className="text-gray-900">ഫോൺ നമ്പർ സുരക്ഷ:</strong> നിങ്ങളുടെ ഫോൺ നമ്പറും ഇമെയിലും പൊതുവായി കാണിക്കില്ല. പരസ്പര താല്പര്യം സ്വീകരിച്ചാൽ മാത്രമേ നമ്പർ വെളിപ്പെടുത്തൂ.</li>
                <li><strong className="text-gray-900">ഫോട്ടോ ബ്ലർ ഓപ്ഷൻ:</strong> ആവശ്യമെങ്കിൽ ഫോട്ടോകൾ മറച്ചുവെക്കാനും താല്പര്യം സ്വീകരിക്കുമ്പോൾ മാത്രം കാണിക്കാനും സാധിക്കും.</li>
                <li><strong className="text-gray-900">സെർച്ച് ഹൈഡ്:</strong> പ്രൊഫൈൽ എപ്പോൾ വേണമെങ്കിലും സെർച്ച് ഫലങ്ങളിൽ നിന്ന് ഹൈഡ് ചെയ്യാം.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">4</span>
                നിങ്ങളുടെ അവകാശങ്ങൾ (Data Principal Rights)
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 border border-gray-150 rounded-xl">
                  <span className="font-bold text-gray-900 block text-xs mb-1">വിവരങ്ങൾ ഡൗൺലോഡ് ചെയ്യാനുള്ള അവകാശം</span>
                  <p className="text-[11px] text-gray-500">നിങ്ങളുടെ പ്രൊഫൈൽ ഡാറ്റ സെറ്റിംഗ്സ് പേജിൽ നിന്നും ഡൗൺലോഡ് ചെയ്യാം.</p>
                </div>
                <div className="p-3 border border-gray-150 rounded-xl">
                  <span className="font-bold text-gray-900 block text-xs mb-1">തിരുത്താനും ഇല്ലാതാക്കാനുമുള്ള അവകാശം</span>
                  <p className="text-[11px] text-gray-500">വിവരങ്ങൾ തിരുത്താനും അക്കൗണ്ട് പൂർണ്ണമായി ഡിലീറ്റ് ചെയ്യാനും സാധിക്കും.</p>
                </div>
              </div>
            </section>

            {/* Section 5 - Grievance Officer */}
            <section className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">5</span>
                പരാതി പരിഹാര ഓഫീസർ (Grievance Redressal)
              </h2>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 text-xs">
                <p className="text-gray-600">സ്വകാര്യത സംബന്ധമായ സംശയങ്ങൾക്കും പരാതികൾക്കും ഞങ്ങളുടെ ഗ്രീവൻസ് ഓഫീസറെ ബന്ധപ്പെടാം:</p>
                <div className="grid sm:grid-cols-2 gap-2 text-gray-800">
                  <p><strong>ഇമെയിൽ:</strong> grievance@malappuramnikah.com</p>
                  <p><strong>ഫോൺ:</strong> +91 98765 43210</p>
                  <p><strong>വിലാസം:</strong> മലപ്പുറം, കേരളം, ഇന്ത്യ</p>
                  <p><strong>പരിഹാര സമയം:</strong> 72 പ്രവൃത്തി മണിക്കൂറിനുള്ളിൽ</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
