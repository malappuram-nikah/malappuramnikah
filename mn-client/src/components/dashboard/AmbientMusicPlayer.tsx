"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";
import { API_URL } from "@/lib/config";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${API_URL}`;

export default function AmbientMusicPlayer() {
  const [enabled, setEnabled] = useState(false);
  const [trackUrl, setTrackUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4); // Default volume 40%

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch settings on mount
  useEffect(() => {
    fetch(`${API_BASE}/user/admin/music/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          setEnabled(data.settings.enable_music !== false);
          setTrackUrl(data.settings.default_track || "");
        }
      })
      .catch(() => {});
  }, []);

  // 2. Initialize Audio & load localStorage preferences
  useEffect(() => {
    if (!enabled || !trackUrl) return;

    // Load preferences
    const savedMuted = localStorage.getItem("mn_music_muted") === "true";
    const savedVolume = localStorage.getItem("mn_music_volume");
    const savedPlaying = localStorage.getItem("mn_music_playing") === "true";

    const initialVolume = savedVolume ? parseFloat(savedVolume) : 0.4;
    setIsMuted(savedMuted);
    setVolume(initialVolume);

    // Create Audio instance
    const audio = new Audio(trackUrl);
    audio.loop = true;
    audio.volume = savedMuted ? 0 : initialVolume;
    audioRef.current = audio;

    // Try autoplay if user previously had it playing (may be blocked by browser until user click)
    if (savedPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay blocked by browser policy
            setIsPlaying(false);
            localStorage.setItem("mn_music_playing", "false");
          });
      }
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [enabled, trackUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem("mn_music_playing", "false");
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem("mn_music_playing", "true");
        })
        .catch((err) => console.log("Playback failed:", err));
    }
  };

  // Handle Mute/Unmute
  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.volume = nextMuted ? 0 : volume;
    setIsMuted(nextMuted);
    localStorage.setItem("mn_music_muted", String(nextMuted));
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem("mn_music_volume", String(val));

    if (audioRef.current) {
      if (isMuted && val > 0) {
        setIsMuted(false);
        localStorage.setItem("mn_music_muted", "false");
      }
      audioRef.current.volume = isMuted ? 0 : val;
    }
  };

  if (!enabled || !trackUrl) return null;

  return (
    <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-gray-600 hover:text-gray-800 transition-all select-none">
      <div className="flex items-center gap-1.5">
        <div className={`p-1 rounded-lg ${isPlaying ? "bg-brand-50 text-brand-600 animate-pulse" : "bg-gray-100 text-gray-400"}`}>
          <Music className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold text-gray-500 hidden sm:inline uppercase tracking-wider">
          Ambient
        </span>
      </div>

      <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 active:scale-95"
          title={isPlaying ? "Pause Ambient Music" : "Play Ambient Music"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 active:scale-95"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Volume Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="w-16 sm:w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 focus:outline-none"
          title="Volume Control"
        />
      </div>
    </div>
  );
}
