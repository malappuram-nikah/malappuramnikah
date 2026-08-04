"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";

export interface ProfessionalInfoData {
  education: string;
  customEducation?: string;
  educationInstitution: string;
  profession: string;
  companyName: string;
  professionType: string;
  jobDetails: string;
  annualIncome: string;
}

interface ProfessionalInfoStepProps {
  initialData?: Partial<ProfessionalInfoData>;
  onComplete?: (data: ProfessionalInfoData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_professional_info_draft";

export default function ProfessionalInfoStep({ initialData, onComplete, onBack }: ProfessionalInfoStepProps) {
  const [formData, setFormData] = useState<ProfessionalInfoData>({
    education: "",
    customEducation: "",
    educationInstitution: "",
    profession: "",
    companyName: "",
    professionType: "",
    jobDetails: "",
    annualIncome: "",
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfessionalInfoData, string>>>({});

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

  const updateForm = (key: keyof ProfessionalInfoData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof ProfessionalInfoData, string>> = {};
    if (!formData.education) newErrors.education = "Education is required";
    if (formData.education === "Others" && !formData.customEducation?.trim()) {
      newErrors.customEducation = "Custom education value is required";
    }
    if (!formData.profession) newErrors.profession = "Profession is required";
    if (!formData.professionType) newErrors.professionType = "Profession Type is required";

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
  const isCustomEducationRequired = formData.education === "Others";
  const totalRequired = isCustomEducationRequired ? 4 : 3;
  const completedRequired = [
    formData.education,
    isCustomEducationRequired ? formData.customEducation : null,
    formData.profession,
    formData.professionType,
  ].filter((v) => !!v).length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Professional Information</h2>
          <p className="text-sm text-gray-500 mt-1">Tell us about your educational and professional background.</p>
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
        
        {/* Education */}
        <section className="space-y-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Education Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Highest Education <span className="text-red-500">*</span></label>
              <select
                value={formData.education}
                onChange={(e) => {
                  const val = e.target.value;
                  updateForm("education", val);
                  if (val !== "Others") {
                    updateForm("customEducation", "");
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Education</option>
                <option value="B.Tech">B.Tech</option>
                <option value="MBBS">MBBS</option>
                <option value="MBA">MBA</option>
                <option value="UG Degree">UG Degree (B.Sc / B.Com / B.A)</option>
                <option value="M.Tech">M.Tech</option>
                <option value="PG Degree">PG Degree (M.Sc / M.A / M.Com)</option>
                <option value="Ph.D">Ph.D</option>
                <option value="Diploma">Diploma</option>
                <option value="High School">High School</option>
                <option value="Others">Others</option>
              </select>
              {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education}</p>}
            </div>

            {formData.education === "Others" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Education <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.customEducation || ""}
                  onChange={(e) => updateForm("customEducation", e.target.value)}
                  placeholder="e.g. Islamic Studies, Diploma in Design"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                />
                {errors.customEducation && <p className="text-red-500 text-xs mt-1">{errors.customEducation}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Education Institution</label>
              <input
                type="text"
                value={formData.educationInstitution}
                onChange={(e) => updateForm("educationInstitution", e.target.value)}
                placeholder="e.g. NIT Calicut, Kerala University"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>
          </div>
        </section>

        {/* Career */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Career Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Profession Type <span className="text-red-500">*</span></label>
              <select
                value={formData.professionType}
                onChange={(e) => updateForm("professionType", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Profession Type</option>
                <option value="Private Sector">Private Sector</option>
                <option value="Government Sector">Government Sector</option>
                <option value="Business / Entrepreneur">Business / Entrepreneur</option>
                <option value="Self Employed">Self Employed</option>
                <option value="Not Working">Not Working</option>
                <option value="Student">Student</option>
                <option value="Others">Others</option>
              </select>
              {errors.professionType && <p className="text-red-500 text-xs mt-1">{errors.professionType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Profession <span className="text-red-500">*</span></label>
              <input
                type="text"
                list="professionOptions"
                value={formData.profession}
                onChange={(e) => updateForm("profession", e.target.value)}
                placeholder="e.g. Software Engineer, Doctor"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
              <datalist id="professionOptions">
                <option value="Software Engineer" />
                <option value="Doctor" />
                <option value="Digital Marketing" />
                <option value="Teacher / Professor" />
                <option value="Engineer" />
                <option value="Chartered Accountant" />
                <option value="Business Owner" />
                <option value="Nurse" />
                <option value="Banker" />
                <option value="Lawyer" />
                <option value="Others" />
              </datalist>
              {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateForm("companyName", e.target.value)}
                placeholder="Where do you work?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Income</label>
              <select
                value={formData.annualIncome}
                onChange={(e) => updateForm("annualIncome", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm appearance-none bg-white"
              >
                <option value="" disabled>Select Income Range</option>
                <option value="Below 2 Lakhs">Below 2 Lakhs</option>
                <option value="2 - 5 Lakhs">2 - 5 Lakhs</option>
                <option value="5 - 10 Lakhs">5 - 10 Lakhs</option>
                <option value="10 - 20 Lakhs">10 - 20 Lakhs</option>
                <option value="20 - 50 Lakhs">20 - 50 Lakhs</option>
                <option value="Above 50 Lakhs">Above 50 Lakhs</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Job Details</label>
              <textarea
                rows={3}
                value={formData.jobDetails}
                onChange={(e) => updateForm("jobDetails", e.target.value)}
                placeholder="Any other details about your career..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm resize-none"
              />
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
