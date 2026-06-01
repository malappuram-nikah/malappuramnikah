"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";

export interface ReligiousInfoData {
  religion: string;
  community: string;
  religiousness: string;
}

interface ReligiousInfoStepProps {
  initialData?: Partial<ReligiousInfoData>;
  onComplete?: (data: ReligiousInfoData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_religious_info_draft";

export default function ReligiousInfoStep({ initialData, onComplete, onBack }: ReligiousInfoStepProps) {
  const [formData, setFormData] = useState<ReligiousInfoData>({
    religion: "Islam", // Default for this platform
    community: "",
    religiousness: "",
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ReligiousInfoData, string>>>({});

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && !initialData) {
      try {
        setFormData(JSON.parse(draft));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    setIsDraftLoaded(true);
  }, [initialData]);

  // Autosave
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isDraftLoaded) return;

    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    setIsSaving(true);
    autosaveTimeout.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000); // 1s debounce

    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, [formData, isDraftLoaded]);

  const updateForm = (key: keyof ReligiousInfoData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof ReligiousInfoData, string>> = {};
    if (!formData.religion) newErrors.religion = "Religion is required";
    if (!formData.community) newErrors.community = "Community is required";
    if (!formData.religiousness) newErrors.religiousness = "Religiousness is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      if (onComplete) onComplete(formData);
      // Optional: Clear draft after successful completion
      // localStorage.removeItem(DRAFT_KEY);
    }
  };

  // Progress calculation
  const totalRequired = 3;
  const completedRequired = [
    formData.religion,
    formData.community,
    formData.religiousness,
  ].filter((v) => !!v).length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Religious Information</h2>
          <p className="text-sm text-gray-500 mt-1">Share your religious background and beliefs.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Completion Tracking */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-brand-600 mb-1">{progressPercent}% Completed</span>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-brand-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        
        <section className="space-y-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Religious Background</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Religion *</label>
              <select
                value={formData.religion}
                onChange={(e) => updateForm("religion", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Religion</option>
                <option value="Islam">Islam</option>
                <option value="Christianity">Christianity</option>
                <option value="Hinduism">Hinduism</option>
                <option value="Other">Other</option>
              </select>
              {errors.religion && <p className="text-red-500 text-xs mt-1">{errors.religion}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Community / Sect *</label>
              <select
                value={formData.community}
                onChange={(e) => updateForm("community", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Community</option>
                {formData.religion === "Islam" ? (
                  <>
                    <option value="Sunni">Sunni</option>
                    <option value="Mujahid">Mujahid</option>
                    <option value="Jamaat-e-Islami">Jamaat-e-Islami</option>
                    <option value="Other">Other</option>
                  </>
                ) : (
                  <option value="Other">Other</option>
                )}
              </select>
              {errors.community && <p className="text-red-500 text-xs mt-1">{errors.community}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Religiousness *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Very Religious", "Religious", "Moderately Religious", "Not Religious"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateForm("religiousness", level)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      formData.religiousness === level
                        ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {errors.religiousness && <p className="text-red-500 text-xs mt-1">{errors.religiousness}</p>}
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-8 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block" />
                Saving draft...
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-4 h-4" />
                Draft saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : null}
          </div>

          <div className="flex w-full sm:w-auto gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Save & Continue
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
