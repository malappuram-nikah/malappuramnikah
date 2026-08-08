"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Eye, 
  ShieldCheck, 
  XCircle,
  FileCheck,
  Fingerprint
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface UserKycInfo {
  kyc_status: string;
  kyc_document_type: string | null;
  kyc_front_url: string | null;
  kyc_back_url: string | null;
  kyc_rejected_reason: string | null;
  kyc_submitted_at: string | null;
  kyc_verified_at: string | null;
}

interface IdentityVerificationFormProps {
  isWizard?: boolean;
  onBack?: () => void;
  onNext?: () => void;
}

export default function IdentityVerificationForm({ isWizard = false, onBack, onNext }: IdentityVerificationFormProps) {
  const [kycInfo, setKycInfo] = useState<UserKycInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload Form State
  const [documentType, setDocumentType] = useState("Aadhaar Card");
  const [frontFile, setFrontFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const [backFile, setBackFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ front: number; back: number }>({ front: 0, back: 0 });
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  // Force show upload form even if rejected, so they can resubmit
  const [forceShowForm, setForceShowForm] = useState(false);

  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem("mn_token");
      let userId = null;
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      }

      if (!userId) {
        setError("User authentication failed.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/user/${userId}?t=${Date.now()}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        cache: "no-store"
      });
      const data = await res.json();
      if (data.success && data.user) {
        setKycInfo({
          kyc_status: data.user.kyc_status || "NOT_SUBMITTED",
          kyc_document_type: data.user.kyc_document_type,
          kyc_front_url: data.user.kyc_front_url,
          kyc_back_url: data.user.kyc_back_url,
          kyc_rejected_reason: data.user.kyc_rejected_reason,
          kyc_submitted_at: data.user.kyc_submitted_at,
          kyc_verified_at: data.user.kyc_verified_at
        });
        
        // Sync to local storage for profile strength calculation
        localStorage.setItem("mn_kyc_status", data.user.kyc_status || "NOT_SUBMITTED");
      }
    } catch (err: any) {
      console.error("Failed to load KYC info", err);
      setError("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: JPG, JPEG, PNG, PDF
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed.");
      return;
    }

    // Validate size: 5MB limit
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("File size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    if (side === "front") {
      setUploadingFront(true);
      setUploadProgress(prev => ({ ...prev, front: 10 }));
    } else {
      setUploadingBack(true);
      setUploadProgress(prev => ({ ...prev, back: 10 }));
    }

    const reader = new FileReader();

    // Simulate progress bar while loading
    let progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const curr = side === "front" ? prev.front : prev.back;
        if (curr >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return {
          ...prev,
          [side]: curr + 15
        };
      });
    }, 100);

    reader.onload = (event) => {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [side]: 100 }));
      
      setTimeout(() => {
        const base64String = event.target?.result as string;
        if (side === "front") {
          setFrontFile({
            name: file.name,
            base64: base64String,
            type: file.type
          });
          setUploadingFront(false);
        } else {
          setBackFile({
            name: file.name,
            base64: base64String,
            type: file.type
          });
          setUploadingBack(false);
        }
      }, 300);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (side: "front" | "back") => {
    if (side === "front") {
      setFrontFile(null);
      setUploadProgress(prev => ({ ...prev, front: 0 }));
    } else {
      setBackFile(null);
      setUploadProgress(prev => ({ ...prev, back: 0 }));
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!frontFile) {
      setError("Front side document upload is mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("mn_token");
      const res = await fetch(`${API_URL}/user/kyc/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          document_type: documentType,
          front_base64: frontFile.base64,
          back_base64: backFile?.base64 || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Identity verification request submitted successfully!");
        setForceShowForm(false);
        setFrontFile(null);
        setBackFile(null);
        localStorage.setItem("mn_kyc_status", "PENDING");
        await fetchKycStatus();
        if (isWizard && onNext) {
          setTimeout(() => {
            onNext();
          }, 600);
        }
      } else {
        setError(data.message || "Failed to submit request.");
      }
    } catch (err: any) {
      console.error(err);
      setError("An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSecureDocumentUrl = (fileName: string) => {
    const token = localStorage.getItem("mn_token");
    return `${API_URL}/user/kyc/document/${fileName}?token=${token}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mr-2" />
        Loading verification details...
      </div>
    );
  }

  const currentStatus = kycInfo?.kyc_status || "NOT_SUBMITTED";

  // If status is VERIFIED, PENDING, or UNDER_REVIEW (and not forcing form show for resubmission)
  if (
    (currentStatus === "VERIFIED" || 
     currentStatus === "PENDING" || 
     currentStatus === "UNDER_REVIEW" || 
     (currentStatus === "REJECTED" && !forceShowForm))
  ) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-50 pb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-brand-600" />
            Identity Verification Status
          </h3>
          <p className="text-xs text-gray-500 mt-1">Track the status of your government-issued ID verification request.</p>
        </div>

        {/* Verification Alert Banner */}
        {currentStatus === "VERIFIED" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-green-900 text-sm">Identity Verified Successfully</h4>
              <p className="text-xs text-green-700 mt-1 leading-relaxed">
                Congratulations! Your identity has been verified by the administration. An "ID Verified" badge is now displayed on your public profile, and your profile strength score has been boosted.
              </p>
              {kycInfo?.kyc_verified_at && (
                <p className="text-[10px] text-green-600 font-medium mt-2">
                  Verified on: {new Date(kycInfo.kyc_verified_at).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}

        {currentStatus === "PENDING" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Verification Pending</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Your submitted documents are currently in the queue for review. Only administrators can approve or reject identity verification requests. You will be notified as soon as our team updates your status.
              </p>
            </div>
          </div>
        )}

        {currentStatus === "UNDER_REVIEW" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Document Under Review</h4>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                An administrator is currently reviewing the documents you uploaded. This process ensures the details on your profile match your government identity document.
              </p>
            </div>
          </div>
        )}

        {currentStatus === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-red-900 text-sm">Identity Verification Rejected</h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Your identity verification request could not be approved by the administrator.
                </p>
              </div>
            </div>
            {kycInfo?.kyc_rejected_reason && (
              <div className="bg-white/80 p-3.5 rounded-xl border border-red-100/50">
                <p className="text-xs font-semibold text-red-800">Reason for Rejection:</p>
                <p className="text-xs text-red-600 mt-1 italic font-medium">
                  "{kycInfo.kyc_rejected_reason}"
                </p>
              </div>
            )}
            <button
              onClick={() => setForceShowForm(true)}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Upload New Document
            </button>
          </div>
        )}

        {/* Verification Timeline */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <h4 className="font-bold text-sm text-gray-900 mb-6">Verification Timeline</h4>
          
          <div className="relative pl-6 space-y-8 border-l border-gray-200">
            {/* Step 1: Upload */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                (currentStatus as string) !== "NOT_SUBMITTED" ? "border-green-600 bg-green-50 text-green-600" : "border-gray-300"
              }`}>
                {(currentStatus as string) !== "NOT_SUBMITTED" && <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />}
              </span>
              <div className="ml-2">
                <p className={`text-sm font-semibold ${(currentStatus as string) !== "NOT_SUBMITTED" ? "text-green-700" : "text-gray-500"}`}>
                  Document Uploaded
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Government ID front/back submitted securely.</p>
              </div>
            </div>

            {/* Step 2: Pending */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                (currentStatus === "PENDING" || currentStatus === "UNDER_REVIEW" || currentStatus === "VERIFIED") 
                  ? "border-green-600 bg-green-50 text-green-600" 
                  : currentStatus === "REJECTED" ? "border-red-500 bg-red-50 text-red-500" : "border-gray-300"
              }`}>
                {(currentStatus === "PENDING" || currentStatus === "UNDER_REVIEW" || currentStatus === "VERIFIED") && <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />}
                {currentStatus === "REJECTED" && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
              </span>
              <div className="ml-2">
                <p className={`text-sm font-semibold ${
                  (currentStatus === "PENDING" || currentStatus === "UNDER_REVIEW" || currentStatus === "VERIFIED") 
                    ? "text-green-700" 
                    : currentStatus === "REJECTED" ? "text-red-600" : "text-gray-500"
                }`}>
                  {currentStatus === "REJECTED" ? "Verification Rejected" : "Verification Pending"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Waiting for administrator review pipeline.</p>
              </div>
            </div>

            {/* Step 3: Under Review */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                (currentStatus === "UNDER_REVIEW" || currentStatus === "VERIFIED") ? "border-green-600 bg-green-50 text-green-600" : "border-gray-300"
              }`}>
                {(currentStatus === "UNDER_REVIEW" || currentStatus === "VERIFIED") && <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />}
              </span>
              <div className="ml-2">
                <p className={`text-sm font-semibold ${(currentStatus === "UNDER_REVIEW" || currentStatus === "VERIFIED") ? "text-green-700" : "text-gray-500"}`}>
                  Under Review
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Admin checking documents against profile information.</p>
              </div>
            </div>

            {/* Step 4: Verified */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                currentStatus === "VERIFIED" ? "border-green-600 bg-green-50 text-green-600" : "border-gray-300"
              }`}>
                {currentStatus === "VERIFIED" && <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />}
              </span>
              <div className="ml-2">
                <p className={`text-sm font-semibold ${currentStatus === "VERIFIED" ? "text-green-700" : "text-gray-500"}`}>
                  ID Verified
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Verified badge unlocked across the matrimony portal.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Documents details */}
        {kycInfo?.kyc_front_url && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Submitted Document Details</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-brand-600" />
                  <span className="text-xs text-gray-900 font-semibold truncate max-w-[150px]">
                    Front Document
                  </span>
                </span>
                <a 
                  href={getSecureDocumentUrl(kycInfo.kyc_front_url)} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-brand-50 text-brand-600 hover:text-brand-700 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold border border-transparent hover:border-brand-100"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </a>
              </div>

              {kycInfo.kyc_back_url && (
                <div className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-brand-600" />
                    <span className="text-xs text-gray-900 font-semibold truncate max-w-[150px]">
                      Back Document
                    </span>
                  </span>
                  <a 
                    href={getSecureDocumentUrl(kycInfo.kyc_back_url)} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-brand-50 text-brand-600 hover:text-brand-700 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold border border-transparent hover:border-brand-100"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {isWizard && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={onBack}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              Back
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm"
            >
              Next Step
            </button>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render the Upload Form
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-50 pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-brand-600" />
          Identity Verification (KYC)
        </h3>
        <p className="text-xs text-gray-500 mt-1">Provide a government-issued identity document to get an 'ID Verified' badge.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200/50 rounded-2xl flex items-start gap-2.5 text-xs text-green-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Document Type Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Step 1: Select Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-gray-800 bg-white"
        >
          <option value="Aadhaar Card">Aadhaar Card</option>
          <option value="Driving License">Driving License</option>
          <option value="Passport">Passport</option>
          <option value="Voter ID">Voter ID</option>
          <option value="National ID">National ID</option>
          <option value="Other Government Issued ID">Other Government Issued ID</option>
        </select>
      </div>

      {/* Document Upload Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Front Side Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Step 2: Front Side Upload <span className="text-red-500">*</span>
          </label>
          
          {!frontFile ? (
            <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-center flex flex-col items-center justify-center min-h-[180px]">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => handleFileChange(e, "front")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingFront}
              />
              {uploadingFront ? (
                <div className="w-full max-w-[150px] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>Reading file...</span>
                    <span>{uploadProgress.front}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600" style={{ width: `${uploadProgress.front}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-xs font-bold text-gray-700">Click or Drag Front Side</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    JPG, JPEG, PNG or PDF (Max 5MB)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center min-h-[180px]">
              <button
                onClick={() => handleRemoveFile("front")}
                className="absolute top-2 right-2 p-1.5 bg-white text-gray-500 hover:text-red-600 rounded-lg shadow-sm border border-gray-100 hover:border-red-100 hover:bg-red-50 transition-colors"
                title="Remove document"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {frontFile.type === "application/pdf" ? (
                <div className="flex flex-col items-center text-center p-4">
                  <FileText className="w-12 h-12 text-red-500 mb-2" />
                  <p className="text-xs font-semibold text-gray-800 truncate max-w-[180px]">{frontFile.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF Document</p>
                </div>
              ) : (
                <div className="flex flex-col items-center p-2">
                  <img
                    src={frontFile.base64}
                    alt="Front Preview"
                    className="max-h-[120px] rounded-lg object-contain shadow-sm border border-gray-100"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 truncate max-w-[180px]">{frontFile.name}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back Side Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Step 3: Back Side Upload <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
          </label>
          
          {!backFile ? (
            <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-center flex flex-col items-center justify-center min-h-[180px]">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => handleFileChange(e, "back")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingBack}
              />
              {uploadingBack ? (
                <div className="w-full max-w-[150px] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>Reading file...</span>
                    <span>{uploadProgress.back}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600" style={{ width: `${uploadProgress.back}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-xs font-bold text-gray-700">Click or Drag Back Side</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    JPG, JPEG, PNG or PDF (Max 5MB)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center min-h-[180px]">
              <button
                onClick={() => handleRemoveFile("back")}
                className="absolute top-2 right-2 p-1.5 bg-white text-gray-500 hover:text-red-600 rounded-lg shadow-sm border border-gray-100 hover:border-red-100 hover:bg-red-50 transition-colors"
                title="Remove document"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {backFile.type === "application/pdf" ? (
                <div className="flex flex-col items-center text-center p-4">
                  <FileText className="w-12 h-12 text-red-500 mb-2" />
                  <p className="text-xs font-semibold text-gray-800 truncate max-w-[180px]">{backFile.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF Document</p>
                </div>
              ) : (
                <div className="flex flex-col items-center p-2">
                  <img
                    src={backFile.base64}
                    alt="Back Preview"
                    className="max-h-[120px] rounded-lg object-contain shadow-sm border border-gray-100"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 truncate max-w-[180px]">{backFile.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rejection context helper if they are resubmitting */}
      {currentStatus === "REJECTED" && kycInfo?.kyc_rejected_reason && (
        <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
          <span className="font-semibold block">Attention:</span>
          Previous submission was rejected due to: <span className="italic font-medium">"{kycInfo.kyc_rejected_reason}"</span>. Please ensure your new files fix this issue.
        </div>
      )}

      {/* Submission Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {isWizard ? (
          <button
            onClick={onBack}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            Back
          </button>
        ) : (
          <div /> // spacer
        )}
        
        <div className="flex items-center gap-3">
          {currentStatus === "REJECTED" && !isWizard && (
            <button
              onClick={() => setForceShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all shrink-0"
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={submitting || !frontFile}
            className={`px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 ${
              (!frontFile || submitting) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin animate-duration-150" />
                Submitting Request...
              </>
            ) : (
              "Submit For Verification"
            )}
          </button>

          {isWizard && (
            <button
              onClick={onNext}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl active:scale-[0.98] transition-all"
            >
              Skip / Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
