"use client";

import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import {
  UploadCloud,
  CheckCircle2,
  Copy,
  Trash2,
  ShieldCheck,
  RefreshCw,
  User,
  GraduationCap,
  Sparkles,
  Home,
  Heart
} from "lucide-react";

interface ExtractedCandidateData {
  // Personal Details
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  height: string;
  location: string;

  // Education & Profession
  highestEducation: string;
  professionType: string;
  workplace: string;

  // Religious Background
  religion: string;
  caste: string;
  religiousness: string;

  // Family Details
  familyType: string;
  financialStatus: string;
  familyValues: string;

  // Lifestyle & Hobbies
  eatingHabits: string;
  smokingHabits: string;
  drinkingHabits: string;
  interestedActivities: string;
  personalDescription: string;
}

export default function InstantRegistrationPage() {
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted Form State
  const [extractedData, setExtractedData] = useState<ExtractedCandidateData | null>(null);

  // Registration Status State
  const [isRegistering, setIsRegistering] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    profileId: string;
    fullName: string;
    mobile: string;
    rawPassword: string;
  } | null>(null);

  // Clipboard success state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (!base64 || !file) {
      setError("Please select or drop an identity document or registration form first.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractedData(null);

    try {
      const res = await adminApi.extractId(base64, file.type);
      if (res.success && res.data) {
        const d = res.data;
        setExtractedData({
          fullName: d.fullName || "",
          mobileNumber: d.mobileNumber || "",
          dateOfBirth: d.dateOfBirth || "1995-01-01",
          gender: d.gender || "Male",
          maritalStatus: d.maritalStatus || "Never Married",
          height: d.height || "",
          location: d.location || d.address || "",

          highestEducation: d.highestEducation || "",
          professionType: d.professionType || "",
          workplace: d.workplace || "",

          religion: d.religion || "Muslim",
          caste: d.caste || "Sunni",
          religiousness: d.religiousness || "Religious",

          familyType: d.familyType || "Nuclear",
          financialStatus: d.financialStatus || "Middle-class",
          familyValues: d.familyValues || "Orthodox / Traditional",

          eatingHabits: d.eatingHabits || "Any",
          smokingHabits: d.smokingHabits || "No",
          drinkingHabits: d.drinkingHabits || "No",
          interestedActivities: d.interestedActivities || "",
          personalDescription: d.personalDescription && d.personalDescription.toLowerCase() !== "not specified" ? d.personalDescription : ""
        });
      } else {
        throw new Error("Failed to extract details from document.");
      }
    } catch (err: any) {
      setError(err?.message || "AI extraction failed. Please try again or verify file format.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedData || !base64 || !file) return;

    setIsRegistering(true);
    setError(null);

    try {
      const res = await adminApi.instantRegistration({
        base64File: base64,
        fullName: extractedData.fullName,
        dateOfBirth: extractedData.dateOfBirth,
        gender: extractedData.gender,
        mobileNumber: extractedData.mobileNumber,
        maritalStatus: extractedData.maritalStatus,
        height: extractedData.height,
        location: extractedData.location,
        highestEducation: extractedData.highestEducation,
        professionType: extractedData.professionType,
        workplace: extractedData.workplace,
        religion: extractedData.religion,
        caste: extractedData.caste,
        religiousness: extractedData.religiousness,
        familyType: extractedData.familyType,
        financialStatus: extractedData.financialStatus,
        familyValues: extractedData.familyValues,
        eatingHabits: extractedData.eatingHabits,
        smokingHabits: extractedData.smokingHabits,
        drinkingHabits: extractedData.drinkingHabits,
        interestedActivities: extractedData.interestedActivities,
        personalDescription: extractedData.personalDescription
      });

      if (res.success && res.data) {
        setSuccessResult({
          profileId: res.data.profileId,
          fullName: res.data.fullName,
          mobile: res.data.mobile,
          rawPassword: res.data.rawPassword,
        });
      } else {
        throw new Error("Instant registration failed.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to complete instant registration.");
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setBase64("");
    setExtractedData(null);
    setSuccessResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 rounded-2xl text-brand-600 border border-brand-100">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Instant Registration & Profile Extraction
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Instantly scan and register members at public events or campaigns. Auto-extract all mandatory profile fields using Gemini AI.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Success Receipt Card */}
      {successResult ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Registration Successful!</h2>
          <p className="text-emerald-700 text-sm mb-6">User has been verified and full profile details have been registered on the platform.</p>

          <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-150 text-left">
            <div>
              <label className="text-xs text-gray-400 font-medium block">FULL NAME</label>
              <span className="text-sm font-bold text-gray-900">{successResult.fullName}</span>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-center">
              <div>
                <label className="text-xs text-gray-400 font-medium block">PROFILE ID</label>
                <span className="text-base font-extrabold text-brand-600">{successResult.profileId}</span>
              </div>
              <button
                onClick={() => copyToClipboard(successResult.profileId, "id")}
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-brand-600 transition-colors"
                title="Copy Profile ID"
              >
                {copiedField === "id" ? <span className="text-xs text-green-600 font-medium">Copied!</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-center">
              <div>
                <label className="text-xs text-gray-400 font-medium block">MOBILE (LOGIN ID)</label>
                <span className="text-sm font-bold text-gray-900">{successResult.mobile}</span>
              </div>
              <button
                onClick={() => copyToClipboard(successResult.mobile, "mobile")}
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-brand-600 transition-colors"
                title="Copy Mobile"
              >
                {copiedField === "mobile" ? <span className="text-xs text-green-600 font-medium">Copied!</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-center">
              <div>
                <label className="text-xs text-gray-400 font-medium block">TEMPORARY PASSWORD</label>
                <span className="text-sm font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{successResult.rawPassword}</span>
              </div>
              <button
                onClick={() => copyToClipboard(successResult.rawPassword, "pass")}
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-brand-600 transition-colors"
                title="Copy Password"
              >
                {copiedField === "pass" ? <span className="text-xs text-green-600 font-medium">Copied!</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3.5 px-4 rounded-xl mt-6 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Register Another Candidate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col items-center justify-center text-center sticky top-6">
              <UploadCloud className="w-12 h-12 text-brand-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Upload Profile / ID Form</h3>
              <p className="text-xs text-gray-500 mb-4 px-2">Support Malappuram Nikah Instant Registration Profile form, ID document, or campaign biodata image.</p>

              {file ? (
                <div className="w-full bg-brand-50/50 p-4 rounded-2xl border border-brand-100 flex items-center justify-between group">
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-brand-700 truncate">{file.name}</p>
                    <p className="text-[10px] text-brand-500 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => { setFile(null); setBase64(""); }}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full border-2 border-dashed border-gray-200 hover:border-brand-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50">
                  <span className="text-xs font-semibold text-brand-600 hover:text-brand-700">Choose Profile Document</span>
                  <span className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || !base64}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-xl mt-6 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Extracting All Fields...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract with Gemini AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Candidate Verification Form */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-150 shadow-sm min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Candidate Verification Form</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Review, edit, and confirm candidate profile details before registration.</p>
                </div>
                {extractedData && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AI Extracted
                  </span>
                )}
              </div>

              {!extractedData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Sparkles className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-600 font-semibold text-sm mb-1">No Profile Extracted Yet</p>
                  <p className="text-gray-400 text-xs max-w-sm">
                    Upload an Instant Registration Profile form or ID document on the left and click <strong>Extract with Gemini AI</strong> to automatically populate all mandatory fields.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  {/* Section 1: Personal Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-brand-600" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">1. Personal & Contact Details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={extractedData.fullName}
                          onChange={(e) => setExtractedData({ ...extractedData, fullName: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Number *</label>
                        <input
                          type="text"
                          value={extractedData.mobileNumber}
                          onChange={(e) => setExtractedData({ ...extractedData, mobileNumber: e.target.value })}
                          placeholder="+91 9876543210"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          value={extractedData.dateOfBirth}
                          onChange={(e) => setExtractedData({ ...extractedData, dateOfBirth: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Gender *</label>
                        <select
                          value={extractedData.gender}
                          onChange={(e) => setExtractedData({ ...extractedData, gender: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Marital Status</label>
                        <select
                          value={extractedData.maritalStatus}
                          onChange={(e) => setExtractedData({ ...extractedData, maritalStatus: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="Never Married">Never Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Awaiting Divorce">Awaiting Divorce</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Height</label>
                        <input
                          type="text"
                          value={extractedData.height}
                          onChange={(e) => setExtractedData({ ...extractedData, height: e.target.value })}
                          placeholder={'e.g. 5\' 8"'}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Location / Address</label>
                        <input
                          type="text"
                          value={extractedData.location}
                          onChange={(e) => setExtractedData({ ...extractedData, location: e.target.value })}
                          placeholder="e.g. Tirur - Kalad"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Education & Profession */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-4 h-4 text-brand-600" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">2. Education & Profession</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Highest Education</label>
                        <input
                          type="text"
                          value={extractedData.highestEducation}
                          onChange={(e) => setExtractedData({ ...extractedData, highestEducation: e.target.value })}
                          placeholder="e.g. MBA, B.Tech"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Profession Type</label>
                        <input
                          type="text"
                          value={extractedData.professionType}
                          onChange={(e) => setExtractedData({ ...extractedData, professionType: e.target.value })}
                          placeholder="e.g. Executive Manager"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Workplace Details</label>
                        <input
                          type="text"
                          value={extractedData.workplace}
                          onChange={(e) => setExtractedData({ ...extractedData, workplace: e.target.value })}
                          placeholder="e.g. Bangalore Manipal Hospital"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Religious Background */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">3. Religious Background</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Religion</label>
                        <input
                          type="text"
                          value={extractedData.religion}
                          onChange={(e) => setExtractedData({ ...extractedData, religion: e.target.value })}
                          placeholder="e.g. Muslim"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Community / Caste</label>
                        <input
                          type="text"
                          value={extractedData.caste}
                          onChange={(e) => setExtractedData({ ...extractedData, caste: e.target.value })}
                          placeholder="e.g. Sunni, Mujahid"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Religiousness Level</label>
                        <select
                          value={extractedData.religiousness}
                          onChange={(e) => setExtractedData({ ...extractedData, religiousness: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="Religious">Religious</option>
                          <option value="Very Religious">Very Religious</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Practicing">Practicing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Family Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="w-4 h-4 text-brand-600" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">4. Family Details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Family Type</label>
                        <select
                          value={extractedData.familyType}
                          onChange={(e) => setExtractedData({ ...extractedData, familyType: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="Nuclear">Nuclear</option>
                          <option value="Joint">Joint</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Financial Status</label>
                        <select
                          value={extractedData.financialStatus}
                          onChange={(e) => setExtractedData({ ...extractedData, financialStatus: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="Middle-class">Middle-class</option>
                          <option value="Upper Middle-class">Upper Middle-class</option>
                          <option value="Affluent">Affluent</option>
                          <option value="Rich">Rich</option>
                          <option value="Modest">Modest</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Family Values</label>
                        <select
                          value={extractedData.familyValues}
                          onChange={(e) => setExtractedData({ ...extractedData, familyValues: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="Orthodox / Traditional">Orthodox / Traditional</option>
                          <option value="Traditional">Traditional</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Liberal">Liberal</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Lifestyle & Hobbies */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-4 h-4 text-brand-600" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">5. Lifestyle, Hobbies & Bio</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Eating Habits</label>
                        <input
                          type="text"
                          value={extractedData.eatingHabits}
                          onChange={(e) => setExtractedData({ ...extractedData, eatingHabits: e.target.value })}
                          placeholder="e.g. Any, Vegetarian, Non-Vegetarian"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Smoking Habit</label>
                        <select
                          value={extractedData.smokingHabits}
                          onChange={(e) => setExtractedData({ ...extractedData, smokingHabits: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                          <option value="Occasionally">Occasionally</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Drinking Habit</label>
                        <select
                          value={extractedData.drinkingHabits}
                          onChange={(e) => setExtractedData({ ...extractedData, drinkingHabits: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                          <option value="Occasionally">Occasionally</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Interested Activities / Hobbies</label>
                        <input
                          type="text"
                          value={extractedData.interestedActivities}
                          onChange={(e) => setExtractedData({ ...extractedData, interestedActivities: e.target.value })}
                          placeholder="e.g. Reading, Travelling, Sports, etc."
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Personal Description / Bio</label>
                        <textarea
                          rows={3}
                          value={extractedData.personalDescription}
                          onChange={(e) => setExtractedData({ ...extractedData, personalDescription: e.target.value })}
                          placeholder="Candidate's personal description or bio..."
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3.5 px-4 rounded-xl mt-6 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account & Verifying Profile...
                      </>
                    ) : (
                      "Confirm and Register Member"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

