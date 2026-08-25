"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save, Trash2, Plus, Crop, ZoomIn } from "lucide-react";

import { saveProfileSection } from "@/lib/profile-utils";
import { useUser } from "@/context/UserContext";
import ImageCropModal from "@/components/common/ImageCropModal";
import PhotoLightboxModal from "@/components/common/PhotoLightboxModal";
import { applyWatermarkToImage } from "@/lib/watermark-utils";

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
  const { refreshUser } = useUser();
  const [formData, setFormData] = useState<ProfilePhotosData>({
    photos: [],
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfilePhotosData, string>>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [cropTarget, setCropTarget] = useState<{ id?: string; url: string } | null>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  
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
      const files = Array.from(e.target.files);

      if (formData.photos.length + files.length > 5) {
        alert("You can upload a maximum of 5 photos.");
        setIsUploading(false);
        return;
      }

      try {
        const loadedPhotos = await Promise.all(
          files.map(async (file) => {
            const rawBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (ev) => resolve(ev.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Automatically apply watermark
            const watermarked = await applyWatermarkToImage(rawBase64, "Malappuram Nikah");

            return {
              id: Math.random().toString(36).substring(2, 9),
              dataUrl: watermarked,
              isPrimary: false,
            };
          })
        );

        const newPhotos = [...formData.photos, ...loadedPhotos];
        if (newPhotos.length > 0 && !newPhotos.some(p => p.isPrimary)) {
          newPhotos[0].isPrimary = true;
        }

        setFormData({ photos: newPhotos });
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

  const handleCropSave = (croppedUrl: string) => {
    if (!cropTarget) return;
    if (cropTarget.id) {
      setFormData({
        photos: formData.photos.map((p) =>
          p.id === cropTarget.id ? { ...p, dataUrl: croppedUrl } : p
        ),
      });
    }
    setCropTarget(null);
  };

  const removePhoto = (id: string) => {
    const filtered = formData.photos.filter(p => p.id !== id);
    if (filtered.length > 0 && !filtered.some(p => p.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    setFormData({ photos: filtered });
  };

  const makePrimary = (id: string) => {
    setFormData({
      photos: formData.photos.map(p => ({
        ...p,
        isPrimary: p.id === id
      }))
    });
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof ProfilePhotosData, string>> = {};
    if (formData.photos.length === 0) {
      newErrors.photos = "Please upload at least one profile picture.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      await saveProfileSection(DRAFT_KEY, formData);
      try { await refreshUser(); } catch {}
      if (onComplete) onComplete(formData);
    }
  };

  const progressPercent = formData.photos.length > 0 ? 100 : 0;

  if (!isDraftLoaded) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden w-full">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Profile Photos</h2>
          <p className="text-sm text-gray-500 mt-1">Upload up to 5 clear, friendly photos of yourself (portrait size).</p>
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {formData.photos.map((photo, i) => (
              <div 
                key={photo.id}
                className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[3/4] group bg-gray-55 shadow-xs"
              >
                <img 
                  src={photo.dataUrl} 
                  alt="Matrimony Profile" 
                  className="w-full h-full object-cover"
                />
                
                {/* Primary star badge */}
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                  {photo.isPrimary ? (
                    <span className="bg-amber-500 text-white w-6 h-6 rounded-full text-[12px] font-extrabold shadow-sm flex items-center justify-center" title="Primary Profile Photo">
                      ★
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makePrimary(photo.id)}
                      className="bg-black/40 hover:bg-black/60 text-white w-6 h-6 rounded-full text-[12px] font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                      title="Make Primary"
                    >
                      ☆
                    </button>
                  )}
                </div>

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2.5 gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => setZoomIndex(i)}
                    title="Zoom Photo"
                    className="p-1.5 bg-white/95 rounded-full shadow hover:scale-110 transition-transform cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-gray-800" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropTarget({ id: photo.id, url: photo.dataUrl })}
                    title="Crop & Adjust"
                    className="p-1.5 bg-white/95 rounded-full shadow hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 text-brand-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="p-1.5 bg-white/95 rounded-full shadow hover:scale-110 transition-transform cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Photo Button Slot */}
            {formData.photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-brand-500 rounded-xl aspect-[3/4] flex flex-col items-center justify-center text-gray-400 hover:text-brand-600 transition-all bg-gray-50/50 hover:bg-brand-50/10 cursor-pointer group"
              >
                <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform animate-pulse" />
                <span className="text-xs font-bold">Add Photo</span>
              </button>
            )}
          </div>

          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {errors.photos && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-550 text-xs font-semibold mt-4 text-center">
              {errors.photos}
            </motion.p>
          )}
          
          {isUploading && (
            <div className="flex items-center justify-center mt-4 gap-2 text-brand-600">
              <span className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <span className="text-xs font-medium">Uploading images...</span>
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
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all text-sm cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save & Continue
            </button>
          </div>
        </div>
      </form>

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.url}
          onCropComplete={handleCropSave}
          onCancel={() => setCropTarget(null)}
        />
      )}

      {zoomIndex !== null && (
        <PhotoLightboxModal
          photos={formData.photos.map((p) => p.dataUrl)}
          initialIndex={zoomIndex}
          userName="Profile Photos"
          onClose={() => setZoomIndex(null)}
        />
      )}
    </div>
  );
}
