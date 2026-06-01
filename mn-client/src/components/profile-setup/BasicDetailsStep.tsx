"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";

export interface BasicDetailsData {
  aboutMe: string;
  name: string;
  age: string;
  profileFor: string;
  gender: string;
  height: string;
  maritalStatus: string;
  motherTongue: string;
  physicalStatus: string;
  appearance: string;
  weight: string;
  languagesSpoken: string;
}

interface BasicDetailsStepProps {
  initialData?: Partial<BasicDetailsData>;
  onComplete?: (data: BasicDetailsData) => void;
}

const DRAFT_KEY = "mn_basic_details_draft";

export default function BasicDetailsStep({ initialData, onComplete }: BasicDetailsStepProps) {
  const [formData, setFormData] = useState<BasicDetailsData>({
    aboutMe: "",
    name: "",
    age: "",
    profileFor: "",
    gender: "",
    height: "",
    maritalStatus: "",
    motherTongue: "",
    physicalStatus: "",
    appearance: "",
    weight: "",
    languagesSpoken: "",
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BasicDetailsData, string>>>({});

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

  const updateForm = (key: keyof BasicDetailsData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof BasicDetailsData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) < 18) {
      newErrors.age = "Valid age (18+) is required";
    }
    if (!formData.profileFor) newErrors.profileFor = "Profile created for is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.maritalStatus) newErrors.maritalStatus = "Marital status is required";
    if (!formData.height) newErrors.height = "Height is required";
    if (!formData.motherTongue) newErrors.motherTongue = "Mother tongue is required";
    if (!formData.aboutMe.trim()) newErrors.aboutMe = "About me is required";

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
  const totalRequired = 8;
  const completedRequired = [
    formData.name,
    formData.age,
    formData.profileFor,
    formData.gender,
    formData.maritalStatus,
    formData.height,
    formData.motherTongue,
    formData.aboutMe,
  ].filter((v) => !!v).length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">About & Basic Details</h2>
          <p className="text-sm text-gray-500 mt-1">Tell us a bit about yourself to find the best matches.</p>
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
        
        {/* Core Identity */}
        <section className="space-y-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Core Identity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Created For *</label>
              <div className="grid grid-cols-2 gap-3">
                {["Myself", "Son", "Daughter", "Brother", "Sister", "Relative"].map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => updateForm("profileFor", rel)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      formData.profileFor === rel
                        ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
              {errors.profileFor && <p className="text-red-500 text-xs mt-1">{errors.profileFor}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
              <div className="grid grid-cols-2 gap-3">
                {["Male", "Female"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateForm("gender", g)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      formData.gender === g
                        ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Age *</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => updateForm("age", e.target.value)}
                placeholder="e.g. 25"
                min="18"
                max="100"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Marital Status *</label>
              <select
                value={formData.maritalStatus}
                onChange={(e) => updateForm("maritalStatus", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Status</option>
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
              </select>
              {errors.maritalStatus && <p className="text-red-500 text-xs mt-1">{errors.maritalStatus}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother Tongue *</label>
              <select
                value={formData.motherTongue}
                onChange={(e) => updateForm("motherTongue", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Language</option>
                <option value="Malayalam">Malayalam</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Urdu">Urdu</option>
                <option value="Other">Other</option>
              </select>
              {errors.motherTongue && <p className="text-red-500 text-xs mt-1">{errors.motherTongue}</p>}
            </div>
          </div>
        </section>

        {/* Physical Attributes */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Physical Attributes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Height *</label>
              <select
                value={formData.height}
                onChange={(e) => updateForm("height", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Height</option>
                <option value="4'10&quot; (147 cm)">4'10" (147 cm)</option>
                <option value="4'11&quot; (149 cm)">4'11" (149 cm)</option>
                <option value="5'0&quot; (152 cm)">5'0" (152 cm)</option>
                <option value="5'1&quot; (154 cm)">5'1" (154 cm)</option>
                <option value="5'2&quot; (157 cm)">5'2" (157 cm)</option>
                <option value="5'3&quot; (160 cm)">5'3" (160 cm)</option>
                <option value="5'4&quot; (162 cm)">5'4" (162 cm)</option>
                <option value="5'5&quot; (165 cm)">5'5" (165 cm)</option>
                <option value="5'6&quot; (167 cm)">5'6" (167 cm)</option>
                <option value="5'7&quot; (170 cm)">5'7" (170 cm)</option>
                <option value="5'8&quot; (172 cm)">5'8" (172 cm)</option>
                <option value="5'9&quot; (175 cm)">5'9" (175 cm)</option>
                <option value="5'10&quot; (177 cm)">5'10" (177 cm)</option>
                <option value="5'11&quot; (180 cm)">5'11" (180 cm)</option>
                <option value="6'0&quot; (182 cm)">6'0" (182 cm)</option>
                <option value="6'1&quot; (185 cm)">6'1" (185 cm)</option>
                <option value="6'2&quot; (187 cm)">6'2" (187 cm)</option>
                <option value="6'3&quot; (190 cm)">6'3" (190 cm)</option>
              </select>
              {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (in kg)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => updateForm("weight", e.target.value)}
                placeholder="e.g. 65"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Physical Status</label>
              <select
                value={formData.physicalStatus}
                onChange={(e) => updateForm("physicalStatus", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Status</option>
                <option value="Normal">Normal</option>
                <option value="Physically Challenged">Physically Challenged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Appearance</label>
              <select
                value={formData.appearance}
                onChange={(e) => updateForm("appearance", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Appearance</option>
                <option value="Fair">Fair</option>
                <option value="Very Fair">Very Fair</option>
                <option value="Wheatish">Wheatish</option>
                <option value="Dark">Dark</option>
              </select>
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">About Me & Languages</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Languages Spoken</label>
              <input
                type="text"
                value={formData.languagesSpoken}
                onChange={(e) => updateForm("languagesSpoken", e.target.value)}
                placeholder="e.g. English, Malayalam, Hindi"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Description / About Me *</label>
              <textarea
                rows={5}
                value={formData.aboutMe}
                onChange={(e) => updateForm("aboutMe", e.target.value)}
                placeholder="Write a brief description about yourself, your hobbies, interests, and what you are looking for..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm resize-none"
              />
              {errors.aboutMe && <p className="text-red-500 text-xs mt-1">{errors.aboutMe}</p>}
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

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}
