"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Save, UploadCloud, Trash2, Camera } from "lucide-react";

export interface PhotoData {
  id: string;
  dataUrl: string; // Base64 or URL
  isPrimary: boolean;
}

export interface ProfilePhotosData {
  photos: PhotoData[];
}

interface ProfilePhotosStepProps {
  initialData?: Partial<ProfilePhotosData>;
  onComplete?: (data: ProfilePhotosData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_profile_photos_draft";

export default function ProfilePhotosStep({ initialData, onComplete, onBack }: ProfilePhotosStepProps) {
  const [formData, setFormData] = useState<ProfilePhotosData>({
    photos: [],
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfilePhotosData, string>>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        setLastSaved(new Date());
      } catch (e) {
        console.warn("Could not save photo to draft", e);
      }
      setIsSaving(false);
    }, 1000); // 1s debounce

    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, [formData, isDraftLoaded]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = (ev) => reject(ev);
          reader.readAsDataURL(file);
        });

        setFormData({
          photos: [{
            id: Math.random().toString(36).substring(2, 9),
            dataUrl,
            isPrimary: true,
          }]
        });
        
        setErrors({});
      } catch (err) {
        console.error("Error loading image:", err);
      } finally {
        setIsUploading(false);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = () => {
    setFormData({ photos: [] });
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof ProfilePhotosData, string>> = {};
    if (formData.photos.length === 0) {
      newErrors.photos = "Please upload a profile picture.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      if (onComplete) onComplete(formData);
    }
  };

  const progressPercent = formData.photos.length > 0 ? 100 : 0;
  const profilePic = formData.photos[0]?.dataUrl || null;

  if (!isDraftLoaded) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-xl mx-auto">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Profile Picture</h2>
          <p className="text-sm text-gray-500 mt-1">Upload a clear, friendly photo of yourself.</p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-brand-600 mb-1">{progressPercent}% Completed</span>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {/* Upload/Preview Section */}
        <div className="flex flex-col items-center justify-center py-6">
          <AnimatePresence mode="wait">
            {profilePic ? (
              <motion.div 
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative"
              >
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-brand-500/30 shadow-lg relative group">
                  <img 
                    src={profilePic} 
                    alt="Profile Picture" 
                    className="w-full h-full object-cover"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Change Photo</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors hover:scale-105 active:scale-95"
                  title="Remove Picture"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-48 h-48 rounded-full border-2 border-dashed border-brand-300 bg-brand-50/30 hover:bg-brand-50 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-4 relative group"
              >
                <UploadCloud className="w-10 h-10 text-brand-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">Upload Photo</span>
                <span className="text-[10px] text-gray-400 mt-1 max-w-[120px]">JPG, PNG or WEBP up to 5MB</span>
              </motion.div>
            )}
          </AnimatePresence>

          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {errors.photos && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-semibold mt-4 text-center">
              {errors.photos}
            </motion.p>
          )}
          
          {isUploading && (
            <div className="flex items-center justify-center mt-4 gap-2 text-brand-600">
              <span className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <span className="text-xs font-medium">Uploading profile picture...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin inline-block" />
                Saving...
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-3.5 h-3.5" />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : null}
          </div>

          <div className="flex w-full sm:w-auto gap-3 justify-end">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all text-sm"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save & Continue
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
