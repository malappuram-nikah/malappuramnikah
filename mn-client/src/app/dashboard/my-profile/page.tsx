"use client";

import {
  useState, useEffect, useRef, useCallback, memo, useMemo
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Edit2, Check, X, Upload, Trash2,
  ShieldCheck, Star, MapPin, Briefcase, BookOpen, Heart,
  Users, Volume2, Video, Plus, AlertCircle, Loader2,
  CheckCircle2, User, Smile, Crop, ZoomIn
} from "lucide-react";
import { getEnrichedProfile } from "@/lib/profile-utils";
import { updateProfileSection, updateProfileSectionByDraftKey, fetchProfileSection, DRAFT_KEY_TO_SECTION } from "@/lib/profile-api";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/lib/config";
import ImageCropModal from "@/components/common/ImageCropModal";
import PhotoLightboxModal from "@/components/common/PhotoLightboxModal";
import { applyWatermarkToImage } from "@/lib/watermark-utils";

/* ──────────────────────────────────────────────────
   AUTH HELPERS  (parsed once, memoized via ref)
────────────────────────────────────────────────── */
function getAuth(): { token: string; userId: number } | null {
  try {
    const token = localStorage.getItem("mn_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId as number;
    if (!userId) return null;
    return { token, userId };
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────
   FIELD  (display only)
────────────────────────────────────────────────── */
const Field = memo(function Field({
  label, value,
}: { label: string; value?: string | number }) {
  return (
    <div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-0.5">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-gray-800 leading-snug">
        {value ?? <span className="text-gray-300 font-normal italic text-xs">Not set</span>}
      </span>
    </div>
  );
});

/* ──────────────────────────────────────────────────
   SECTION CARD
────────────────────────────────────────────────── */
const SectionCard = memo(function SectionCard({
  title, icon, badge, onEdit, children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
            {icon}
          </span>
          <span className="text-[13px] font-bold text-gray-800">{title}</span>
          {badge && (
            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-[11px] font-bold text-brand-600 hover:bg-brand-50 active:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">{children}</div>
    </motion.div>
  );
});

/* ──────────────────────────────────────────────────
   INLINE EDIT MODAL  (optimistic + abort safe)
────────────────────────────────────────────────── */
interface EditField {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  span?: boolean;
}

function EditModal({
  title, fields, draftKey, onClose, onOptimisticSave, onAfterSave,
}: {
  title: string;
  fields: EditField[];
  draftKey: string;
  onClose: () => void;
  onOptimisticSave: (draftKey: string, data: Record<string, string>) => void;
  onAfterSave?: (profileCompletion: import("@/lib/profile-api").ProfileCompletionResult) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  // Pre-fill from backend section API (fallback: localStorage)
  useEffect(() => {
    let cancelled = false;
    const section = DRAFT_KEY_TO_SECTION[draftKey];

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) setForm(JSON.parse(raw));
      } catch {}
    };

    if (!section) {
      loadFromStorage();
      return;
    }

    (async () => {
      try {
        const auth = getAuth();
        if (!auth) {
          loadFromStorage();
          return;
        }
        const result = await fetchProfileSection(section, auth.userId);
        if (cancelled) return;
        const data = (result.data || {}) as Record<string, string>;
        setForm(data);
        localStorage.setItem(draftKey, JSON.stringify(data));
      } catch {
        if (!cancelled) loadFromStorage();
      }
    })();

    return () => { cancelled = true; };
  }, [draftKey]);

  // Cleanup abort on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSave = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus("saving");
    try {
      const existing = JSON.parse(localStorage.getItem(draftKey) || "{}");
      const merged = { ...existing, ...form };

      // 1. Update localStorage immediately
      localStorage.setItem(draftKey, JSON.stringify(merged));

      // 2. Optimistic UI update — parent sees changes without waiting for network
      onOptimisticSave(draftKey, merged);

      // 3. Section API sync (partial update — preserves other sections)
      const auth = getAuth();
      if (auth) {
        const result = await updateProfileSectionByDraftKey(draftKey, merged);
        if (result.profileCompletion && onAfterSave) {
          onAfterSave(result.profileCompletion);
        }
      }

      setStatus("saved");
      setTimeout(() => { if (!ctrl.signal.aborted) onClose(); }, 700);
    } catch (e: any) {
      if (e?.name !== "AbortError") setStatus("error");
    }
  }, [draftKey, form, onClose, onOptimisticSave, onAfterSave]);

  const btnLabel = {
    idle: <><Check className="w-3.5 h-3.5" /> Save Changes</>,
    saving: <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>,
    saved: <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>,
    error: <>Error — Retry</>,
  }[status];

  const btnClass = {
    idle: "bg-brand-600 hover:bg-brand-700 text-white",
    saving: "bg-brand-400 text-white opacity-70 cursor-not-allowed",
    saved: "bg-green-600 text-white",
    error: "bg-red-500 text-white",
  }[status];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="sm:motion-reduce:initial-none relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Edit {title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key} className={f.span ? "col-span-2" : ""}>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1.5 uppercase tracking-wide">
                  {f.label}
                </label>
                {f.options ? (
                  <select
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50/50 transition-shadow"
                  >
                    <option value="">Select…</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none bg-gray-50/50"
                  />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50/50"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${btnClass}`}
          >
            {btnLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   PHOTO MANAGER MODAL
────────────────────────────────────────────────── */
interface PhotoData {
  id: string;
  dataUrl: string;
  isPrimary: boolean;
}

function PhotoManagerModal({
  initialPhotos, onClose, onSaved, onAfterSave,
}: {
  initialPhotos: PhotoData[];
  onClose: () => void;
  onSaved: (photos: PhotoData[]) => void;
  onAfterSave?: (profileCompletion: import("@/lib/profile-api").ProfileCompletionResult) => void;
}) {
  const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropTarget, setCropTarget] = useState<{ id?: string; url: string } | null>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const processed: PhotoData[] = [];

      for (const file of fileArray) {
        const rawBase64 = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = (e) => resolve(e.target?.result as string);
          r.readAsDataURL(file);
        });

        // Apply automatic elegant watermark
        const watermarked = await applyWatermarkToImage(rawBase64, "Malappuram Nikah");
        processed.push({
          id: `p_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          dataUrl: watermarked,
          isPrimary: false,
        });
      }

      setPhotos((prev) => {
        const merged = [...prev, ...processed];
        if (!merged.some((p) => p.isPrimary) && merged.length > 0) {
          merged[0] = { ...merged[0], isPrimary: true };
        }
        return merged;
      });
    } catch (err) {
      console.error("Error processing photos:", err);
    } finally {
      setUploading(false);
    }
  }, []);

  const setPrimary = useCallback((id: string) => {
    setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === id })));
  }, []);

  const remove = useCallback((id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length > 0 && !next.some((p) => p.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }, []);

  const handleCropSave = (croppedUrl: string) => {
    if (!cropTarget) return;
    if (cropTarget.id) {
      // Update existing photo
      setPhotos((prev) =>
        prev.map((p) => (p.id === cropTarget.id ? { ...p, dataUrl: croppedUrl } : p))
      );
    } else {
      // Add as new photo
      setPhotos((prev) => {
        const newPhoto: PhotoData = {
          id: `p_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          dataUrl: croppedUrl,
          isPrimary: prev.length === 0,
        };
        return [...prev, newPhoto];
      });
    }
    setCropTarget(null);
  };

  const handleSave = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSaving(true);
    try {
      const DRAFT_KEY = "mn_profile_photos_draft";
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ photos }));

      // Optimistic: callback immediately
      onSaved(photos);

      const auth = getAuth();
      if (auth) {
        const result = await updateProfileSection("photos", { photos }, auth.userId);
        if (result.profileCompletion && onAfterSave) {
          onAfterSave(result.profileCompletion);
        }
      }
      onClose();
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error(e);
    } finally {
      setSaving(false);
    }
  }, [photos, onClose, onSaved, onAfterSave]);

  return (
    <>
      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.url}
          onCropComplete={handleCropSave}
          onCancel={() => setCropTarget(null)}
        />
      )}

      {zoomIndex !== null && (
        <PhotoLightboxModal
          photos={photos.map((p) => p.dataUrl)}
          initialIndex={zoomIndex}
          userName="My Photos"
          onClose={() => setZoomIndex(null)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 300 }}
          className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10"
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-brand-600" />
              Manage Photos
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 flex-1 space-y-4">
            {/* Upload area */}
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-2xl p-6 cursor-pointer transition-all bg-brand-50/20 hover:bg-brand-50 group">
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
              ) : (
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-brand-600" />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">Click to upload photos</p>
                <p className="text-xs text-gray-400 mt-0.5">Auto-watermarked · JPG or PNG</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            {/* Grid */}
            {photos.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No photos yet. Upload above.</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {photos.length} photo{photos.length !== 1 ? "s" : ""} — hover to manage / crop / zoom
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <AnimatePresence>
                    {photos.map((p, i) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="relative group aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-brand-300 transition-all cursor-pointer shadow-xs"
                      >
                        <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                        {p.isPrimary && (
                          <div className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow z-10">
                            PRIMARY
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomIndex(i);
                            }}
                            title="Zoom Fullscreen"
                            className="p-1.5 bg-white/95 rounded-full shadow hover:scale-110 transition-transform"
                          >
                            <ZoomIn className="w-3.5 h-3.5 text-gray-800" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCropTarget({ id: p.id, url: p.dataUrl });
                            }}
                            title="Crop & Adjust"
                            className="p-1.5 bg-white/95 rounded-full shadow hover:scale-110 transition-transform"
                          >
                            <Crop className="w-3.5 h-3.5 text-brand-600" />
                          </button>
                          {!p.isPrimary && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimary(p.id);
                              }}
                              title="Set as primary"
                              className="p-1.5 bg-white/95 rounded-full shadow hover:scale-110 transition-transform"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(p.id);
                            }}
                            title="Delete"
                            className="p-1.5 bg-white/95 rounded-full shadow hover:scale-110 transition-transform"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-white">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-4 h-4" /> Save Photos ({photos.length})</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────
   SKELETON
────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-5 w-48 bg-gray-200 rounded-full" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-20 bg-gray-100 rounded-2xl" />
        </div>
        <div className="md:col-span-2 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   SECTION FIELDS CONFIG  (memoized outside component)
────────────────────────────────────────────────── */
const SECTION_CONFIGS: {
  title: string;
  draftKey: string;
  fields: EditField[];
}[] = [
  {
    title: "Basic Details",
    draftKey: "mn_basic_details_draft",
    fields: [
      { key: "aboutMe", label: "About Me", type: "textarea", span: true },
      { key: "gender", label: "Gender", options: ["Male", "Female"] },
      { key: "age", label: "Age", type: "number" },
      { key: "height", label: "Height (e.g. 5'8\")" },
      { key: "weight", label: "Weight (e.g. 65 kg)" },
      { key: "maritalStatus", label: "Marital Status", options: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"] },
      { key: "presentLocation", label: "Current Location" },
      { key: "motherTongue", label: "Mother Tongue" },
      { key: "physicalStatus", label: "Physical Status", options: ["Normal", "Differently Abled"] },
      { key: "languagesSpoken", label: "Languages Spoken" },
      { key: "marriageGoalPlan", label: "Marriage Timeline", options: ["Within 6 months", "Within 1 year", "1–2 years", "No hurry"] },
      { key: "relocateForPartner", label: "Willing to Relocate?", options: ["Yes", "No", "Maybe"] },
    ],
  },
  {
    title: "Religious Details",
    draftKey: "mn_religious_info_draft",
    fields: [
      { key: "community", label: "Community / Sect", options: ["Sunni", "Shia", "Mujahid", "Tabligh", "Others"] },
      { key: "religiousness", label: "Religiousness", options: ["Very Religious", "Moderately Religious", "Not Religious"] },
      { key: "namaz", label: "Namaz Habits", options: ["5 times a day", "Regularly", "Occasionally", "No"] },
      { key: "quranReading", label: "Quran Reading", options: ["Hafiz", "Can read with Tajweed", "Can read", "Learning", "No"] },
    ],
  },
  {
    title: "Professional Details",
    draftKey: "mn_professional_info_draft",
    fields: [
      { key: "education", label: "Education", options: ["High School", "Higher Secondary", "Diploma", "Bachelors", "Masters", "PhD", "Others"] },
      { key: "customEducation", label: "Education (if Others)" },
      { key: "educationalInstitution", label: "Educational Institution", span: true },
      { key: "professionType", label: "Profession Type", options: ["Private", "Government", "Business", "Self-Employed", "Student", "Homemaker", "Not Working"] },
      { key: "profession", label: "Job Title" },
      { key: "companyName", label: "Company / Organisation" },
      { key: "annualIncome", label: "Annual Income", options: ["< ₹2L", "₹2L–5L", "₹5L–10L", "₹10L–25L", "₹25L–50L", "> ₹50L"] },
    ],
  },
  {
    title: "Family Details",
    draftKey: "mn_family_details_draft",
    fields: [
      { key: "familyType", label: "Family Type", options: ["Nuclear", "Joint", "Extended"] },
      { key: "familyValues", label: "Family Values", options: ["Very Traditional", "Traditional", "Moderate", "Liberal"] },
      { key: "financialStatus", label: "Financial Status", options: ["Affluent", "Upper Middle Class", "Middle Class", "Lower Middle Class"] },
      { key: "fatherOccupation", label: "Father's Occupation" },
      { key: "motherOccupation", label: "Mother's Occupation" },
      { key: "siblingsCount", label: "Number of Siblings", type: "number" },
    ],
  },
  {
    title: "Partner Preferences",
    draftKey: "mn_partner_preferences_draft",
    fields: [
      { key: "prefAgeMin", label: "Age Min", type: "number" },
      { key: "prefAgeMax", label: "Age Max", type: "number" },
      { key: "prefMaritalStatus", label: "Marital Status", options: ["Never Married", "Divorced", "Widowed", "Any"] },
      { key: "prefReligion", label: "Religion" },
      { key: "prefCommunity", label: "Community / Sect", options: ["Sunni", "Shia", "Mujahid", "Tabligh", "Any"] },
      { key: "prefNamaz", label: "Namaz", options: ["5 times a day", "Regularly", "Occasionally", "Any"] },
      { key: "prefQuranReading", label: "Quran Reading", options: ["Hafiz", "Can read", "Any"] },
      { key: "prefEducation", label: "Education", options: ["Any", "Bachelors and above", "Masters and above", "PhD"] },
      { key: "prefLocations", label: "Preferred Locations", span: true },
    ],
  },
];

const SECTION_ICONS: React.ReactNode[] = [
  <User key="u" className="w-3.5 h-3.5 text-brand-500" />,
  <Star key="s" className="w-3.5 h-3.5 text-amber-500" />,
  <Briefcase key="b" className="w-3.5 h-3.5 text-blue-500" />,
  <Users key="us" className="w-3.5 h-3.5 text-green-500" />,
  <Heart key="h" className="w-3.5 h-3.5 text-pink-500" />,
];

/* ──────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────── */
export default function MyProfilePage() {
  const router = useRouter();
  const { percentage, strength, styles, incompleteSections, applyCompletion } = useProfileCompletion();
  const { refreshUser } = useUser();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [editSectionIdx, setEditSectionIdx] = useState<number | null>(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  }, []);

  /* ── Fetch (abort-safe, no double call) ─────── */
  const loadProfile = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const auth = getAuth();
      if (!auth) { router.push("/login"); return; }

      const res = await fetch(
        `${API_URL}/user/${auth.userId}?t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
          cache: "no-store",
          signal: ctrl.signal,
        }
      );
      const data = await res.json();
      if (ctrl.signal.aborted) return;

      if (data.success && data.user) {
        const enriched = getEnrichedProfile(data.user);
        const photos: PhotoData[] =
          data.user.profile_details?.mn_profile_photos_draft?.photos ?? [];
        const mapped = {
          ...enriched,
          photos,
          video: data.user.profile_details?.mn_video_intro_draft?.video?.dataUrl ?? null,
          voice: data.user.profile_details?.mn_voice_intro_draft?.voice?.dataUrl ?? null,
          kyc_status: data.user.kyc_status,
        };
        setProfile(mapped);
        const primary =
          photos.find((p) => p.isPrimary)?.dataUrl ??
          photos[0]?.dataUrl ??
          enriched.photo ??
          null;
        setActivePhoto(primary);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error("loadProfile:", e);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
    return () => { abortRef.current?.abort(); };
  }, [loadProfile]);

  /* ── Optimistic section save (no refetch!) ─── */
  const handleOptimisticSave = useCallback(
    (draftKey: string, data: Record<string, string>) => {
      setProfile((prev: any) => {
        if (!prev) return prev;
        // Merge the changed fields into the profile directly
        const keyMap: Record<string, Partial<any>> = {
          mn_basic_details_draft: {
            aboutMe: data.aboutMe,
            gender: data.gender,
            age: data.age ? parseInt(data.age) : prev.age,
            height: data.height,
            weight: data.weight,
            maritalStatus: data.maritalStatus,
            location: data.presentLocation,
            motherTongue: data.motherTongue,
            physicalStatus: data.physicalStatus,
            languagesSpoken: data.languagesSpoken,
            marriageGoalPlan: data.marriageGoalPlan,
            relocateForPartner: data.relocateForPartner,
          },
          mn_religious_info_draft: {
            community: data.community,
            religiousness: data.religiousness,
            namaz: data.namaz,
            quranReading: data.quranReading,
          },
          mn_professional_info_draft: {
            education: data.customEducation || data.education,
            educationalInstitution: data.educationalInstitution,
            profession: data.profession,
            companyName: data.companyName,
            annualIncome: data.annualIncome,
          },
          mn_family_details_draft: {
            familyType: data.familyType,
            familyValues: data.familyValues,
            financialStatus: data.financialStatus,
            fatherOccupation: data.fatherOccupation,
            motherOccupation: data.motherOccupation,
            siblingsCount: data.siblingsCount,
          },
          mn_partner_preferences_draft: {
            prefAge: data.prefAgeMin && data.prefAgeMax
              ? `${data.prefAgeMin} to ${data.prefAgeMax} Yrs`
              : prev.prefAge,
            prefMaritalStatus: data.prefMaritalStatus,
            prefReligion: data.prefReligion,
            prefCommunity: data.prefCommunity,
            prefNamaz: data.prefNamaz,
            prefQuranReading: data.prefQuranReading,
            prefEducation: data.prefEducation,
            prefLocations: data.prefLocations,
          },
        };
        return { ...prev, ...(keyMap[draftKey] ?? {}) };
      });
      showToast("Section updated!");
    },
    [showToast]
  );

  /* ── Photo optimistic update ─────────────────── */
  const handlePhotosSaved = useCallback((photos: PhotoData[]) => {
    setProfile((prev: any) => prev ? { ...prev, photos } : prev);
    const primary =
      photos.find((p) => p.isPrimary)?.dataUrl ?? photos[0]?.dataUrl ?? null;
    setActivePhoto(primary);
    showToast("Photos saved!");
  }, [showToast]);

  const handleCompletionUpdate = useCallback(
    async (profileCompletion: import("@/lib/profile-api").ProfileCompletionResult) => {
      applyCompletion(profileCompletion);
      await refreshUser();
    },
    [applyCompletion, refreshUser]
  );

  /* ── Render ──────────────────────────────────── */
  if (loading) return <Skeleton />;

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">Could not load your profile.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-brand-600 underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const photos: PhotoData[] = profile.photos ?? [];
  const editSection = editSectionIdx !== null ? SECTION_CONFIGS[editSectionIdx] : null;
  const isVerified = profile.kyc_status === "VERIFIED";

  return (
    <>
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] text-white text-xs font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 pointer-events-none ${
              toast.ok ? "bg-gray-900" : "bg-red-600"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {editSection && (
          <EditModal
            key="editmodal"
            title={editSection.title}
            fields={editSection.fields}
            draftKey={editSection.draftKey}
            onClose={() => setEditSectionIdx(null)}
            onOptimisticSave={handleOptimisticSave}
            onAfterSave={handleCompletionUpdate}
          />
        )}
        {photoModal && (
          <PhotoManagerModal
            key="photomodal"
            initialPhotos={photos}
            onClose={() => setPhotoModal(false)}
            onSaved={handlePhotosSaved}
            onAfterSave={handleCompletionUpdate}
          />
        )}
      </AnimatePresence>

      {/* ── Page ── */}
      <div className="max-w-6xl mx-auto pb-20 space-y-6">
        {/* Breadcrumb & Top Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 font-medium text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <span className="text-gray-200">/</span>
            <span className="font-bold text-gray-800">My Profile</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-[11px] font-bold shadow-xs ml-2 ${styles.text}`}>
              <Star className="w-3 h-3" />
              {percentage}% · {strength}
            </span>
          </div>

          <button
            onClick={() => router.push("/dashboard/profile-builder")}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* ── LEFT ── */}
          <div className="md:col-span-1 space-y-4 md:sticky md:top-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Main photo */}
              <div
                onClick={() => setPhotoModal(true)}
                className="relative h-72 bg-gray-100 overflow-hidden cursor-pointer group"
                title="Click to edit / add photos"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhoto ?? "placeholder"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    {activePhoto ? (
                      <img src={activePhoto} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#026d77]/10 via-[#026d77]/20 to-[#026d77]/35 flex flex-col items-center justify-center p-6 text-center">
                        <img src="/logoMain-01.svg" alt="MN Logo" className="w-20 h-20 object-contain opacity-55 mb-2" />
                        <span className="text-[10px] font-bold text-[#026d77]/70 uppercase tracking-widest">Malappuram Nikah</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-brand-600" />
                    <span>Change Photo</span>
                  </div>
                </div>

                {/* Verified badge */}
                {isVerified && (
                  <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 shadow z-10">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </div>
                )}

                {/* Manage photos */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoModal(true);
                  }}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow hover:bg-white transition-colors z-10"
                >
                  <Camera className="w-3.5 h-3.5 text-brand-600" />
                  {photos.length > 0 ? `${photos.length} Photos` : "Add Photo"}
                </button>

                {/* Name */}
                <div className="absolute bottom-10 left-4 right-28 pointer-events-none z-10">
                  <h1 className="text-xl font-bold text-white drop-shadow leading-tight">
                    {profile.name}
                  </h1>
                  <p className="text-gray-300 text-xs font-medium mt-0.5">
                    {[profile.age && `${profile.age} yrs`, profile.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              {/* Thumbnail strip */}
              {photos.length > 0 && (
                <div className="px-3 py-2.5 border-b border-gray-50">
                  <div className="flex gap-2 overflow-x-auto pb-0.5 hide-scrollbar">
                    {photos.map((p, i) => (
                      <button
                        key={p.id ?? i}
                        onClick={() => setActivePhoto(p.dataUrl)}
                        className={`shrink-0 w-11 h-11 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                          activePhoto === p.dataUrl
                            ? "border-brand-500 shadow-md scale-95"
                            : "border-gray-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      onClick={() => setPhotoModal(true)}
                      className="shrink-0 w-11 h-11 rounded-xl border-2 border-dashed border-brand-300 flex items-center justify-center text-brand-400 hover:bg-brand-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Quick info */}
              <div className="p-4 space-y-2.5">
                {profile.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="font-medium">{profile.location}</span>
                  </div>
                )}
                {profile.profession && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-medium">{profile.profession}</span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <BookOpen className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="font-medium">{profile.education}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    {profile.profileId}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    isVerified ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {isVerified ? "✓ Verified" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Profile strength */}
              <div className="mx-4 mb-4 p-3 rounded-xl border border-gray-100 bg-gray-50/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Profile Strength</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.text}`}>
                    {percentage}% · {strength}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} style={{ width: `${percentage}%` }} />
                </div>
                {incompleteSections[0] && (
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Next: {incompleteSections[0].name} — {incompleteSections[0].suggestion}
                  </p>
                )}
              </div>

              {/* No photo nudge */}
              {photos.length === 0 && (
                <button
                  onClick={() => setPhotoModal(true)}
                  className="mx-4 mb-4 w-[calc(100%-2rem)] p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  No photos — Add now to get more matches!
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="md:col-span-2 space-y-4">

            {/* Basic Details */}
            <SectionCard
              title="Basic Details"
              icon={SECTION_ICONS[0]}
              onEdit={() => setEditSectionIdx(0)}
            >
              {profile.aboutMe && (
                <div className="col-span-2 text-[13px] text-gray-600 leading-relaxed italic border-l-2 border-brand-200 pl-3 py-0.5">
                  {profile.aboutMe}
                </div>
              )}
              <Field label="Gender" value={profile.gender} />
              <Field label="Age" value={profile.age ? `${profile.age} yrs` : undefined} />
              <Field label="Height" value={profile.height} />
              <Field label="Weight" value={profile.weight} />
              <Field label="Marital Status" value={profile.maritalStatus} />
              <Field label="Mother Tongue" value={profile.motherTongue} />
              <Field label="Languages" value={profile.languagesSpoken} />
              <Field label="Marriage Timeline" value={profile.marriageGoalPlan} />
            </SectionCard>

            {/* Religious */}
            <SectionCard
              title="Religious Details"
              icon={SECTION_ICONS[1]}
              onEdit={() => setEditSectionIdx(1)}
            >
              <Field label="Community" value={profile.community} />
              <Field label="Religiousness" value={profile.religiousness} />
              <Field label="Namaz" value={profile.namaz} />
              <Field label="Quran Reading" value={profile.quranReading} />
            </SectionCard>

            {/* Professional */}
            <SectionCard
              title="Professional Details"
              icon={SECTION_ICONS[2]}
              onEdit={() => setEditSectionIdx(2)}
            >
              <Field label="Education" value={profile.education} />
              <Field label="Institution" value={profile.educationalInstitution} />
              <Field label="Profession" value={profile.profession} />
              <Field label="Company" value={profile.companyName} />
              <Field label="Annual Income" value={profile.annualIncome} />
            </SectionCard>

            {/* Family */}
            <SectionCard
              title="Family Details"
              icon={SECTION_ICONS[3]}
              onEdit={() => setEditSectionIdx(3)}
            >
              <Field label="Family Type" value={profile.familyType} />
              <Field label="Family Values" value={profile.familyValues} />
              <Field label="Financial Status" value={profile.financialStatus} />
              <Field label="Father's Occupation" value={profile.fatherOccupation} />
              <Field label="Mother's Occupation" value={profile.motherOccupation} />
              <Field label="Siblings" value={profile.siblingsCount} />
            </SectionCard>

            {/* Partner Preferences */}
            <SectionCard
              title="Partner Preferences"
              icon={SECTION_ICONS[4]}
              onEdit={() => setEditSectionIdx(4)}
            >
              <Field label="Preferred Age" value={profile.prefAge} />
              <Field label="Marital Status" value={profile.prefMaritalStatus} />
              <Field label="Religion" value={profile.prefReligion} />
              <Field label="Community" value={profile.prefCommunity} />
              <Field label="Namaz" value={profile.prefNamaz} />
              <Field label="Quran Reading" value={profile.prefQuranReading} />
              <Field label="Education" value={profile.prefEducation} />
              <div className="col-span-2">
                <Field label="Preferred Locations" value={profile.prefLocations} />
              </div>
            </SectionCard>

            {/* Voice Introduction */}
            {profile.voice && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                    <Smile className="w-4 h-4 text-purple-500" />
                    Voice Introduction
                  </h3>
                  <button
                    onClick={() => router.push("/dashboard/profile-builder?step=9")}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    Update →
                  </button>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Voice
                  </p>
                  <audio src={profile.voice} controls className="w-full h-8 accent-brand-600" />
                </div>
              </motion.div>
            )}

            {/* KYC Banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-4 flex items-start gap-3.5 ${
                isVerified ? "bg-blue-50 border-blue-150" : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isVerified ? "bg-blue-100" : "bg-amber-100"
              }`}>
                <ShieldCheck className={`w-5 h-5 ${isVerified ? "text-blue-600" : "text-amber-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {isVerified ? "Identity Verified ✓" : "Verification Pending"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {isVerified
                    ? "Your profile badge is active. Other members can see you are verified."
                    : "Our team is reviewing your documents. For queries: +91 99 61 896886."}
                </p>
              </div>
              {!isVerified && (
                <button
                  onClick={() => router.push("/dashboard/profile-builder?step=11")}
                  className="shrink-0 text-[11px] font-bold text-amber-700 underline whitespace-nowrap"
                >
                  Upload docs
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
