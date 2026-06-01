"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Save, UploadCloud, Trash2, Mic, Square, Play, Pause, RefreshCw } from "lucide-react";

export interface VoiceData {
  id: string;
  dataUrl: string; // Base64 or Blob URL
  name: string;
}

export interface VoiceIntroData {
  voice: VoiceData | null;
}

interface VoiceIntroStepProps {
  initialData?: Partial<VoiceIntroData>;
  onComplete?: (data: VoiceIntroData) => void;
  onBack?: () => void;
}

const DRAFT_KEY = "mn_voice_intro_draft";

export default function VoiceIntroStep({ initialData, onComplete, onBack }: VoiceIntroStepProps) {
  const [formData, setFormData] = useState<VoiceIntroData>({
    voice: null,
    ...initialData,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof VoiceIntroData, string>>>({});
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
        console.warn("Could not save audio to draft", e);
      }
      setIsSaving(false);
    }, 1000);

    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, [formData, isDraftLoaded]);

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64 to enable localStorage caching
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setFormData({
            voice: {
              id: Math.random().toString(36).substring(2, 9),
              dataUrl: reader.result as string,
              name: "Voice_Introduction.webm"
            }
          });
        };

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setErrors({});
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      setErrors({ voice: "Microphone access denied or not available." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Format time for recording counter (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('audio/')) {
        setErrors({ voice: "Please upload a valid audio file." });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ voice: "Audio size must be less than 10MB." });
        return;
      }

      setErrors({});

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = (ev) => reject(ev);
          reader.readAsDataURL(file);
        });

        setFormData({
          voice: {
            id: Math.random().toString(36).substring(2, 9),
            dataUrl,
            name: file.name
          }
        });
      } catch (err) {
        setErrors({ voice: "Error reading the audio file." });
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeVoice = () => {
    setFormData({ voice: null });
    setRecordingTime(0);
  };

  const validate = () => {
    setErrors({});
    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      if (onComplete) onComplete(formData);
    }
  };

  const progressPercent = formData.voice ? 100 : 0;

  if (!isDraftLoaded) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair text-gray-900">Voice Introduction</h2>
          <p className="text-sm text-gray-500 mt-1">Let potential matches hear your voice and personality.</p>
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
        
        {!formData.voice ? (
          <section className="space-y-6">
            
            {/* Record Option */}
            <div className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-12 px-4 text-center transition-all ${
                isRecording ? "border-red-300 bg-red-50/30" : "border-brand-200 bg-brand-50/50"
              }`}
            >
              <AnimatePresence mode="wait">
                {!isRecording ? (
                  <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4 hover:scale-110 hover:bg-brand-200 transition-all shadow-sm"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Record a Voice Note</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Tap the microphone to start recording. A 30-second introduction works best!
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="recording" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                    <div className="relative flex items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" />
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="relative z-10 w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-105 hover:bg-red-600 transition-all shadow-md shadow-red-500/20"
                      >
                        <Square className="w-8 h-8 fill-current" />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-red-500 mb-1 font-mono tracking-wider">
                      {formatTime(recordingTime)}
                    </h3>
                    <p className="text-sm text-gray-500 animate-pulse">Recording in progress... Tap to stop</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-4 text-gray-400 text-sm font-medium w-full max-w-xs mx-auto">
              <div className="flex-1 h-px bg-gray-200" />
              OR
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Upload Option */}
            <div className="flex flex-col items-center justify-center">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording}
                className="px-6 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <UploadCloud className="w-5 h-5" />
                Upload Audio File
              </button>
              <p className="text-xs text-gray-500 mt-2">MP3 or WAV up to 10MB.</p>
              
              <input 
                type="file" 
                accept="audio/mp3, audio/wav, audio/ogg, audio/webm" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {errors.voice && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-sm font-medium text-center pt-2">
                {errors.voice}
              </motion.p>
            )}
          </section>
        ) : (
          /* Audio Preview Area */
          <section className="space-y-6">
            <div className="bg-brand-50/50 rounded-2xl p-6 md:p-8 border border-brand-100 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-6">
                <Mic className="w-8 h-8" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
                Your Voice Introduction is Ready
              </h3>

              <div className="w-full max-w-md bg-white rounded-full p-2 border border-gray-200 shadow-sm mb-6">
                <audio 
                  src={formData.voice.dataUrl} 
                  controls 
                  className="w-full h-10"
                  controlsList="nodownload"
                />
              </div>
              
              <div className="flex items-center justify-center gap-3 w-full">
                <button 
                  type="button"
                  onClick={removeVoice}
                  className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-record
                </button>
                <button 
                  type="button"
                  onClick={removeVoice}
                  className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
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
