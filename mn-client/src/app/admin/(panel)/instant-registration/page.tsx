"use client";

import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { UploadCloud, CheckCircle2, Copy, Trash2, ShieldCheck, RefreshCw } from "lucide-react";

export default function InstantRegistrationPage() {
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted Form State
  const [extractedData, setExtractedData] = useState<{
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNumber: string;
    address: string;
    caste: string;
  } | null>(null);

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
      setError("Please select or drop an identity document first.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractedData(null);

    try {
      const res = await adminApi.extractId(base64, file.type);
      if (res.success && res.data) {
        setExtractedData({
          fullName: res.data.fullName || "",
          dateOfBirth: res.data.dateOfBirth || "1995-01-01",
          gender: res.data.gender || "Male",
          mobileNumber: res.data.mobileNumber || "",
          address: res.data.address || "",
          caste: res.data.caste || "Other",
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
      const res = await adminApi.instantRegistration(
        base64,
        extractedData.fullName,
        extractedData.dateOfBirth,
        extractedData.gender,
        extractedData.mobileNumber,
        extractedData.address,
        extractedData.caste
      );

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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-brand-600" />
          Instant Campaign Registration
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Instantly register members at public events. Upload an ID document or template form to auto-extract details using Gemini 1.5 Flash.
        </p>
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
          <p className="text-emerald-700 text-sm mb-6">User has been verified and registered on the platform.</p>

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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column: Upload */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col items-center justify-center text-center">
              <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">Upload ID Document</h3>
              <p className="text-xs text-gray-500 mb-4 px-2">Support front/back Aadhaar card, Passport details page, or campaign template form.</p>

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
                  <span className="text-xs font-semibold text-brand-600 hover:text-brand-700">Choose File</span>
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
                    AI Extracting...
                  </>
                ) : (
                  "Extract with Gemini"
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Review Details Form */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm min-h-[300px] flex flex-col">
              <h2 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Candidate Verification Form</h2>

              {!extractedData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <p className="text-gray-400 text-sm">Upload an ID document and click **Extract with Gemini** to pre-fill verification form fields.</p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name (from ID)</label>
                      <input
                        type="text"
                        value={extractedData.fullName}
                        onChange={(e) => setExtractedData({ ...extractedData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                      <input
                        type="text"
                        value={extractedData.mobileNumber}
                        onChange={(e) => setExtractedData({ ...extractedData, mobileNumber: e.target.value })}
                        placeholder="e.g. +919876543210"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Date of Birth</label>
                      <input
                        type="date"
                        value={extractedData.dateOfBirth}
                        onChange={(e) => setExtractedData({ ...extractedData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Gender</label>
                      <select
                        value={extractedData.gender}
                        onChange={(e) => setExtractedData({ ...extractedData, gender: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Caste / Sect</label>
                      <input
                        type="text"
                        value={extractedData.caste}
                        onChange={(e) => setExtractedData({ ...extractedData, caste: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Place / Address</label>
                      <input
                        type="text"
                        value={extractedData.address}
                        onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm bg-white"
                        required
                      />
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
                        Creating Account & Verifying KYC...
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
