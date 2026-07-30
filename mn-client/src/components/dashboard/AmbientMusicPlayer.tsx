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

    // Load preferences (default to playing unless explicitly paused)
    const savedMuted = localStorage.getItem("mn_music_muted") === "true";
    const savedVolume = localStorage.getItem("mn_music_volume");
    const savedPlaying = localStorage.getItem("mn_music_playing") !== "false";

    const initialVolume = savedVolume ? parseFloat(savedVolume) : 0.4;
    setVolume(initialVolume);

    // Create Audio instance
    const audio = new Audio(trackUrl);
    audio.loop = true;
    audio.volume = initialVolume;
    audioRef.current = audio;

    if (savedPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            // Autoplay blocked by browser policy
            setIsPlaying(false);
            setIsMuted(true);
            localStorage.setItem("mn_music_playing", "false");
            localStorage.setItem("mn_music_muted", "true");
          });
      }
    } else {
      setIsPlaying(false);
      setIsMuted(true);
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
      setIsMuted(true);
      localStorage.setItem("mn_music_playing", "false");
      localStorage.setItem("mn_music_muted", "true");
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
          localStorage.setItem("mn_music_playing", "true");
          localStorage.setItem("mn_music_muted", "false");
        })
        .catch((err) => console.log("Playback failed:", err));
    }
  };

  // Handle Mute/Unmute (clicking sound icon toggles play/pause)
  const toggleMute = () => {
    togglePlay();
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem("mn_music_volume", String(val));

    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  if (!enabled || !trackUrl) return null;

  return (
    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-sm text-gray-500 hover:text-gray-700 transition-all select-none">
      {/* Play/Pause (Music) Toggle */}
      <button
        onClick={togglePlay}
        className={`p-1.5 rounded-lg transition-all active:scale-95 ${
          isPlaying ? "bg-brand-50 text-brand-600 animate-pulse" : "bg-transparent text-gray-400 hover:text-gray-600"
        }`}
        title={isPlaying ? "Pause Ambient Music" : "Play Ambient Music"}
      >
        <Music className="w-4 h-4" />
      </button>

      {/* Mute/Unmute (Sound) Toggle */}
      <button
        onClick={toggleMute}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600 active:scale-95"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
