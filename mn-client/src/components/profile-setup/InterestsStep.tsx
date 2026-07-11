"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

export interface InterestsData {
  interests: string[];
  personalityDescription: string;
}

interface InterestsStepProps {
  initialData?: Partial<InterestsData>;
  onComplete?: (data: InterestsData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_interests_draft";

const PREDEFINED_INTERESTS = [
  "Reading", "Traveling", "Cooking", "Photography", "Fitness", 
  "Music", "Movies", "Sports", "Nature", "Art & Design", 
  "Technology", "Gaming", "Volunteering", "Foodie", "Writing"
];

export default function InterestsStep({ initialData, onComplete, onBack }: InterestsStepProps) {
  const [formData, setFormData] = useState<InterestsData>({
    interests: [],
    personalityDescription: "",
    ...initialData,
  });

  const [customInterest, setCustomInterest] = useState("");
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InterestsData, string>>>({});

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

  const updateForm = (key: keyof InterestsData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const toggleInterest = (interest: string) => {
    const current = formData.interests;
    const isSelected = current.includes(interest);
    
    let updated;
    if (isSelected) {
      updated = current.filter((i) => i !== interest);
    } else {
      updated = [...current, interest];
    }
    
    updateForm("interests", updated);
  };

  const handleAddCustomInterest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInterest.trim();
    if (trimmed && !formData.interests.includes(trimmed)) {
      updateForm("interests", [...formData.interests, trimmed]);
      setCustomInterest("");
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof InterestsData, string>> = {};
    if (formData.interests.length === 0) newErrors.interests = "Select at least one interest";
    if (!formData.personalityDescription.trim()) newErrors.personalityDescription = "Personality description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      if (onComplete) onComplete(formData);
      // Optional: Clear draft after successful completion
      // localStorage.removeItem(DRAFT_KEY);
    } else { toast.error("Please fill required details"); }
  };

  // Progress calculation
  const totalRequired = 2; // interests array > 0, personalityDescription text
  const completedRequired = [
    formData.interests.length > 0 ? "yes" : "",
    formData.personalityDescription.trim(),
  ].filter((v) => !!v).length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Interests & Personality</h2>
          <p className="text-sm text-gray-500 mt-1">Let potential matches know what you're passionate about.</p>
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

      <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
        
        {/* Interests */}
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Your Interests *</h3>
            <p className="text-sm text-gray-500 mb-4">Select the activities and hobbies you enjoy, or add your own.</p>
            
            <div className="flex flex-wrap gap-3 mb-6">
              {PREDEFINED_INTERESTS.map((interest) => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-brand-600 text-white border border-brand-600 shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {interest}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
              
              {/* Display custom added interests that aren't in predefined list */}
              {formData.interests
                .filter((interest) => !PREDEFINED_INTERESTS.includes(interest))
                .map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 bg-brand-600 text-white border border-brand-600 shadow-sm"
                  >
                    {interest}
                    <X className="w-3.5 h-3.5" />
                  </button>
                ))
              }
            </div>

            {/* Add custom interest input */}
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInterest();
                  }
                }}
                placeholder="Add custom interest..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                disabled={!customInterest.trim()}
                className="p-2.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {errors.interests && <p className="text-red-500 text-xs mt-2">{errors.interests}</p>}
          </div>
        </section>

        {/* Personality */}
        <section className="space-y-6 pt-6 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Personality Description *</h3>
          
          <div>
            <textarea
              rows={6}
              value={formData.personalityDescription}
              onChange={(e) => updateForm("personalityDescription", e.target.value)}
              placeholder="Describe your personality, your goals in life, what makes you unique, and what kind of partner you are looking for..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm resize-none"
            />
            {errors.personalityDescription && <p className="text-red-500 text-xs mt-1">{errors.personalityDescription}</p>}
            <p className="text-xs text-gray-400 mt-2">A detailed description gets up to 4x more responses.</p>
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
