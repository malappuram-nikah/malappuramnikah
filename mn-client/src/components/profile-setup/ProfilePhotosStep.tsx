"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Save, UploadCloud, Trash2, Star, GripVertical, Image as ImageIcon } from "lucide-react";

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
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        setLastSaved(new Date());
      } catch (e) {
        console.warn("Could not save photos to draft (likely too large for localStorage)", e);
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
      const files = Array.from(e.target.files);
      const newPhotos: PhotoData[] = [];

      for (const file of files) {
        // Read file as Data URL to support preview and localStorage
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = (ev) => reject(ev);
          reader.readAsDataURL(file);
        });

        newPhotos.push({
          id: Math.random().toString(36).substring(2, 9),
          dataUrl,
          isPrimary: false,
        });
      }

      setFormData((prev) => {
        let updatedPhotos = [...prev.photos, ...newPhotos];
        // Ensure at least one is primary if photos exist
        if (updatedPhotos.length > 0 && !updatedPhotos.find(p => p.isPrimary)) {
          updatedPhotos[0].isPrimary = true;
        }
        return { ...prev, photos: updatedPhotos };
      });
      
      setErrors({});
      setIsUploading(false);
    }
    
    // Reset file input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (id: string) => {
    setFormData((prev) => {
      let updatedPhotos = prev.photos.filter((p) => p.id !== id);
      
      // If primary was removed, assign primary to the first available
      if (updatedPhotos.length > 0 && !updatedPhotos.find(p => p.isPrimary)) {
        updatedPhotos[0].isPrimary = true;
      }
      
      return { ...prev, photos: updatedPhotos };
    });
  };

  const setPrimaryPhoto = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      })),
    }));
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const updatedPhotos = [...prev.photos];
      if (direction === 'up' && index > 0) {
        const temp = updatedPhotos[index];
        updatedPhotos[index] = updatedPhotos[index - 1];
        updatedPhotos[index - 1] = temp;
      } else if (direction === 'down' && index < updatedPhotos.length - 1) {
        const temp = updatedPhotos[index];
        updatedPhotos[index] = updatedPhotos[index + 1];
        updatedPhotos[index + 1] = temp;
      }
      return { ...prev, photos: updatedPhotos };
    });
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof ProfilePhotosData, string>> = {};
    if (formData.photos.length === 0) {
      newErrors.photos = "Please upload at least one profile photo.";
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

  // Progress calculation
  const progressPercent = formData.photos.length > 0 ? 100 : 0;

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Profile Photos</h2>
          <p className="text-sm text-gray-500 mt-1">Upload clear, recent photos. Profiles with photos get 10x more responses.</p>
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
        
        {/* Upload Area */}
        <section className="space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-brand-200 rounded-2xl bg-brand-50/50 hover:bg-brand-50 transition-colors cursor-pointer flex flex-col items-center justify-center py-12 px-4 text-center group"
          >
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload your photos</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              JPEG or PNG up to 5MB. Upload at least 1 photo to continue. First photo will be your primary display picture.
            </p>
            <button 
              type="button"
              className="px-6 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse Files
            </button>
            <input 
              type="file" 
              multiple 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {errors.photos && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-sm font-medium text-center">
              {errors.photos}
            </motion.p>
          )}
          
          {isUploading && (
            <div className="flex items-center justify-center py-4 gap-3 text-brand-600">
              <span className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <span className="text-sm font-medium">Processing images...</span>
            </div>
          )}
        </section>

        {/* Gallery Preview */}
        {formData.photos.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Your Gallery ({formData.photos.length})</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {formData.photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden group border-2 ${
                      photo.isPrimary ? "border-brand-500 shadow-md" : "border-gray-200"
                    }`}
                  >
                    <img 
                      src={photo.dataUrl} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between">
                        <button 
                          type="button"
                          onClick={() => setPrimaryPhoto(photo.id)}
                          className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
                            photo.isPrimary 
                              ? "bg-brand-500 text-white" 
                              : "bg-white/20 text-white hover:bg-brand-500"
                          }`}
                          title="Set as Primary"
                        >
                          <Star className={`w-4 h-4 ${photo.isPrimary ? "fill-white" : ""}`} />
                        </button>

                        <div className="flex gap-1">
                          {index > 0 && (
                            <button type="button" onClick={() => movePhoto(index, 'up')} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-colors" title="Move Left">
                              &larr;
                            </button>
                          )}
                          {index < formData.photos.length - 1 && (
                            <button type="button" onClick={() => movePhoto(index, 'down')} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-colors" title="Move Right">
                              &rarr;
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button 
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-colors"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Primary Badge */}
                    {photo.isPrimary && (
                      <div className="absolute bottom-3 left-3 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                        Primary
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

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
              Save & Finish
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
