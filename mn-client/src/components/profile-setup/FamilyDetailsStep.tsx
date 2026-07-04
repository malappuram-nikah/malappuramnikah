"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";

export interface FamilyDetailsData {
  familyType: string;
  financialStatus: string;
  familyValues: string;
  fatherName: string;
  fatherStatus: string; // Alive / Deceased
  fatherOccupation: string;
  motherName: string;
  motherStatus: string; // Alive / Deceased
  motherOccupation: string;
  elderBrothers: string;
  youngerBrothers: string;
  marriedBrothers: string;
  elderSisters: string;
  youngerSisters: string;
  marriedSisters: string;
}

interface FamilyDetailsStepProps {
  initialData?: Partial<FamilyDetailsData>;
  onComplete?: (data: FamilyDetailsData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_family_details_draft";

export default function FamilyDetailsStep({ initialData, onComplete, onBack }: FamilyDetailsStepProps) {
  const [formData, setFormData] = useState<FamilyDetailsData>({
    familyType: "",
    financialStatus: "",
    familyValues: "",
    fatherName: "",
    fatherStatus: "Alive",
    fatherOccupation: "",
    motherName: "",
    motherStatus: "Alive",
    motherOccupation: "",
    elderBrothers: "0",
    youngerBrothers: "0",
    marriedBrothers: "0",
    elderSisters: "0",
    youngerSisters: "0",
    marriedSisters: "0",
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FamilyDetailsData, string>>>({});

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && !initialData) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(JSON.parse(draft));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDraftLoaded(true);
  }, [initialData]);

  // Autosave
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isDraftLoaded) return;

    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = setTimeout(() => {
      setIsSaving(true);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000); // 1s debounce

    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, [formData, isDraftLoaded]);

  const updateForm = (key: keyof FamilyDetailsData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const updateNumeric = (key: keyof FamilyDetailsData, value: string) => {
    // Only allow numbers, empty string defaults to 0 internally or allow empty
    if (value === "" || /^\d+$/.test(value)) {
      updateForm(key, value === "" ? "0" : parseInt(value, 10).toString());
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FamilyDetailsData, string>> = {};
    if (!formData.familyType) newErrors.familyType = "Family Type is required";
    if (!formData.financialStatus) newErrors.financialStatus = "Financial Status is required";
    if (!formData.familyValues) newErrors.familyValues = "Family Values are required";

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
  const totalRequired = 3; // familyType, financialStatus, familyValues
  const completedRequired = [
    formData.familyType,
    formData.financialStatus,
    formData.familyValues,
  ].filter((v) => !!v).length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Family & Living Details</h2>
          <p className="text-sm text-gray-500 mt-1">Tell us about your family background and siblings.</p>
        </div>
        
        <div className="flex items-center gap-4">
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
        
        {/* General Family Info */}
        <section className="space-y-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Family Background</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Family Type *</label>
              <select
                value={formData.familyType}
                onChange={(e) => updateForm("familyType", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Family Type</option>
                <option value="Nuclear">Nuclear</option>
                <option value="Joint">Joint</option>
                <option value="Extended">Extended</option>
              </select>
              {errors.familyType && <p className="text-red-500 text-xs mt-1">{errors.familyType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Financial Status *</label>
              <select
                value={formData.financialStatus}
                onChange={(e) => updateForm("financialStatus", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Status</option>
                <option value="Rich">Rich</option>
                <option value="Upper Middle Class">Upper Middle Class</option>
                <option value="Middle Class">Middle Class</option>
                <option value="Lower Middle Class">Lower Middle Class</option>
                <option value="Poor">Poor</option>
              </select>
              {errors.financialStatus && <p className="text-red-500 text-xs mt-1">{errors.financialStatus}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Family Values *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Orthodox", "Traditional", "Moderate", "Liberal"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateForm("familyValues", val)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      formData.familyValues === val
                        ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              {errors.familyValues && <p className="text-red-500 text-xs mt-1">{errors.familyValues}</p>}
            </div>
          </div>
        </section>

        {/* Parents Info */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Parents Info</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {/* Father */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Alive?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.fatherStatus === "Alive"}
                      onChange={(e) => updateForm("fatherStatus", e.target.checked ? "Alive" : "Deceased")}
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => updateForm("fatherName", e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
              <div>
                <input
                  type="text"
                  value={formData.fatherOccupation}
                  onChange={(e) => updateForm("fatherOccupation", e.target.value)}
                  placeholder="Occupation"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Mother */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Alive?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.motherStatus === "Alive"}
                      onChange={(e) => updateForm("motherStatus", e.target.checked ? "Alive" : "Deceased")}
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={formData.motherName}
                onChange={(e) => updateForm("motherName", e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
              <div>
                <input
                  type="text"
                  value={formData.motherOccupation}
                  onChange={(e) => updateForm("motherOccupation", e.target.value)}
                  placeholder="Occupation"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Siblings */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Siblings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Brothers */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Brothers</h4>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Elder Brothers</label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => updateNumeric("elderBrothers", Math.max(0, parseInt(formData.elderBrothers) - 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">-</button>
                  <input type="text" inputMode="numeric" value={formData.elderBrothers} onChange={(e) => updateNumeric("elderBrothers", e.target.value)} className="w-10 text-center text-sm font-medium focus:outline-none" />
                  <button type="button" onClick={() => updateNumeric("elderBrothers", (parseInt(formData.elderBrothers) + 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Younger Brothers</label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => updateNumeric("youngerBrothers", Math.max(0, parseInt(formData.youngerBrothers) - 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">-</button>
                  <input type="text" inputMode="numeric" value={formData.youngerBrothers} onChange={(e) => updateNumeric("youngerBrothers", e.target.value)} className="w-10 text-center text-sm font-medium focus:outline-none" />
                  <button type="button" onClick={() => updateNumeric("youngerBrothers", (parseInt(formData.youngerBrothers) + 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                <label className="text-sm font-medium text-gray-700">Married Brothers</label>
                <div className="flex items-center bg-white border border-brand-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => updateNumeric("marriedBrothers", Math.max(0, parseInt(formData.marriedBrothers) - 1).toString())} className="px-3 py-1.5 hover:bg-brand-50 text-brand-600">-</button>
                  <input type="text" inputMode="numeric" value={formData.marriedBrothers} onChange={(e) => updateNumeric("marriedBrothers", e.target.value)} className="w-10 text-center text-sm font-bold text-brand-700 focus:outline-none" />
                  <button type="button" onClick={() => updateNumeric("marriedBrothers", (parseInt(formData.marriedBrothers) + 1).toString())} className="px-3 py-1.5 hover:bg-brand-50 text-brand-600">+</button>
                </div>
              </div>
            </div>

            {/* Sisters */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Sisters</h4>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Elder Sisters</label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => updateNumeric("elderSisters", Math.max(0, parseInt(formData.elderSisters) - 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">-</button>
                  <input type="text" inputMode="numeric" value={formData.elderSisters} onChange={(e) => updateNumeric("elderSisters", e.target.value)} className="w-10 text-center text-sm font-medium focus:outline-none" />
                  <button type="button" onClick={() => updateNumeric("elderSisters", (parseInt(formData.elderSisters) + 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Younger Sisters</label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => updateNumeric("youngerSisters", Math.max(0, parseInt(formData.youngerSisters) - 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">-</button>
                  <input type="text" inputMode="numeric" value={formData.youngerSisters} onChange={(e) => updateNumeric("youngerSisters", e.target.value)} className="w-10 text-center text-sm font-medium focus:outline-none" />
                  <button type="button" onClick={() => updateNumeric("youngerSisters", (parseInt(formData.youngerSisters) + 1).toString())} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                <label className="text-sm font-medium text-gray-700">Married Sisters</label>
                <div className="flex items-center bg-white border border-brand-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => updateNumeric("marriedSisters", Math.max(0, parseInt(formData.marriedSisters) - 1).toString())} className="px-3 py-1.5 hover:bg-brand-50 text-brand-600">-</button>
                  <input type="text" inputMode="numeric" value={formData.marriedSisters} onChange={(e) => updateNumeric("marriedSisters", e.target.value)} className="w-10 text-center text-sm font-bold text-brand-700 focus:outline-none" />
                  <button type="button" onClick={() => updateNumeric("marriedSisters", (parseInt(formData.marriedSisters) + 1).toString())} className="px-3 py-1.5 hover:bg-brand-50 text-brand-600">+</button>
                </div>
              </div>
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
