"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Save, UploadCloud, Trash2, Video as VideoIcon } from "lucide-react";

export interface VideoData {
  id: string;
  dataUrl: string; // Base64 or URL
  name: string;
}

export interface VideoIntroData {
  video: VideoData | null;
}

interface VideoIntroStepProps {
  initialData?: Partial<VideoIntroData>;
  onComplete?: (data: VideoIntroData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_video_intro_draft";

export default function VideoIntroStep({ initialData, onComplete, onBack }: VideoIntroStepProps) {
  const [formData, setFormData] = useState<VideoIntroData>({
    video: null,
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof VideoIntroData, string>>>({});
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
        console.warn("Could not save video to draft (likely too large for localStorage)", e);
      }
      setIsSaving(false);
    }, 1000); // 1s debounce

    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, [formData, isDraftLoaded]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Basic validation: Check if file is video
      if (!file.type.startsWith('video/')) {
        setErrors({ video: "Please upload a valid video file." });
        return;
      }
      
      // Basic validation: Check size (e.g. limit to 50MB for frontend draft logic)
      if (file.size > 50 * 1024 * 1024) {
        setErrors({ video: "Video size must be less than 50MB." });
        return;
      }

      setIsUploading(true);
      setErrors({});

      try {
        // Read file as Data URL to support preview and localStorage
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = (ev) => reject(ev);
          reader.readAsDataURL(file);
        });

        setFormData({
          video: {
            id: Math.random().toString(36).substring(2, 9),
            dataUrl,
            name: file.name
          }
        });
      } catch (err) {
        setErrors({ video: "Error reading the video file. Please try again." });
      }

      setIsUploading(false);
    }
    
    // Reset file input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setFormData({ video: null });
  };

  const validate = () => {
    // Video is usually optional, but if you want to make it required, uncomment the next lines
    // const newErrors: Partial<Record<keyof VideoIntroData, string>> = {};
    // if (!formData.video) {
    //   newErrors.video = "Please upload an introduction video.";
    //   setErrors(newErrors);
    //   return false;
    // }
    setErrors({});
    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      if (onComplete) onComplete(formData);
    }
  };

  // Progress calculation
  const progressPercent = formData.video ? 100 : 0;

  if (!isDraftLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Video Introduction</h2>
          <p className="text-sm text-gray-500 mt-1">Stand out by uploading a short 30-second introduction video.</p>
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
        
        {!formData.video ? (
          /* Upload Area */
          <section className="space-y-4">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-16 px-4 text-center transition-colors ${
                isUploading 
                  ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed" 
                  : "border-brand-200 bg-brand-50/50 hover:bg-brand-50 cursor-pointer group"
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${
                isUploading ? "bg-gray-200 text-gray-500" : "bg-brand-100 text-brand-600 group-hover:scale-110"
              }`}>
                {isUploading ? (
                  <span className="w-8 h-8 border-4 border-gray-300 border-t-brand-600 rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {isUploading ? "Processing video..." : "Upload your video"}
              </h3>
              
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                {isUploading 
                  ? "Please wait while we prepare your video for preview." 
                  : "MP4 or WebM up to 50MB. Keep it under 60 seconds for best results."
                }
              </p>
              
              {!isUploading && (
                <button 
                  type="button"
                  className="px-6 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Browse Files
                </button>
              )}
              
              <input 
                type="file" 
                accept="video/mp4, video/webm, video/quicktime" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            {errors.video && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-sm font-medium text-center">
                {errors.video}
              </motion.p>
            )}
          </section>
        ) : (
          /* Video Preview Area */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-brand-600" />
                Your Introduction
              </h3>
            </div>
            
            <AnimatePresence>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-gray-100 shadow-sm max-w-2xl mx-auto"
              >
                <video 
                  src={formData.video.dataUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  controlsList="nodownload"
                  preload="auto"
                />
                
                {/* Overlay controls - Delete */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm text-sm font-medium transition-colors"
                  >
                    Replace
                  </button>
                  <button 
                    type="button"
                    onClick={removeVideo}
                    className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-colors"
                    title="Delete Video"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <p className="text-center text-sm text-gray-500 font-medium">
              {formData.video.name}
            </p>
            
            <input 
              type="file" 
              accept="video/mp4, video/webm, video/quicktime" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
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
