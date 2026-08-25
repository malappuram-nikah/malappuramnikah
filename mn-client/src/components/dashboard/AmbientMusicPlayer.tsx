"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Music, SkipForward, SkipBack } from "lucide-react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${API_URL}`;

const DEFAULT_PLAYLIST = [
  {
    id: "track-1",
    title: "Peaceful Nikah Ambient (Royalty Free)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "track-2",
    title: "Acoustic Harmony (Royalty Free)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "track-3",
    title: "Calm Malabar Strings (Royalty Free)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    id: "track-4",
    title: "Golden Sunrise Instrumental (Royalty Free)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  }
];

export default function AmbientMusicPlayer() {
  const [enabled, setEnabled] = useState(true);
  const [playlist, setPlaylist] = useState(DEFAULT_PLAYLIST);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch admin music settings on mount
  useEffect(() => {
    fetch(`${API_BASE}/user/admin/music/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          setEnabled(data.settings.enable_music !== false);
          if (data.settings.default_track) {
            setPlaylist((prev) => {
              const customTrack = {
                id: "custom-default",
                title: "Default Platform Soundtrack",
                url: data.settings.default_track
              };
              const filtered = prev.filter((t) => t.url !== data.settings.default_track);
              return [customTrack, ...filtered];
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  // 2. Load saved track index & preferences from localStorage
  useEffect(() => {
    const savedTrack = localStorage.getItem("mn_music_track_index");
    if (savedTrack !== null) {
      const idx = parseInt(savedTrack, 10);
      if (!isNaN(idx) && idx >= 0 && idx < playlist.length) {
        setCurrentTrackIndex(idx);
      }
    }
  }, [playlist.length]);

  const activeTrack = playlist[currentTrackIndex] || playlist[0];

  // 3. Audio instance lifecycle
  const playTrack = useCallback(
    (trackUrl: string) => {
      if (!audioRef.current) return;
      audioRef.current.src = trackUrl;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem("mn_music_playing", "true");
        })
        .catch(() => {
          setIsPlaying(false);
          localStorage.setItem("mn_music_playing", "false");
        });
    },
    []
  );

  useEffect(() => {
    if (!enabled || !activeTrack?.url) return;

    const savedVolume = localStorage.getItem("mn_music_volume");
    const savedPlaying = localStorage.getItem("mn_music_playing") === "true";
    const initialVolume = savedVolume ? parseFloat(savedVolume) : 0.4;
    setVolume(initialVolume);

    const audio = new Audio(activeTrack.url);
    audio.loop = true;
    audio.volume = initialVolume;
    audioRef.current = audio;

    if (savedPlaying) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
          localStorage.setItem("mn_music_playing", "false");
        });
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [enabled, activeTrack?.url]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem("mn_music_playing", "false");
      toast.info("Ambient music paused", { duration: 1500 });
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem("mn_music_playing", "true");
          toast.success(`Playing: ${activeTrack?.title}`, { duration: 2000 });
        })
        .catch((err) => console.log("Playback failed:", err));
    }
  };

  // Next Track
  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    localStorage.setItem("mn_music_track_index", String(nextIdx));

    const nextTrack = playlist[nextIdx];
    toast.success(`Now Playing: ${nextTrack.title} (${nextIdx + 1}/${playlist.length})`, {
      icon: "🎵",
      duration: 2500
    });

    if (audioRef.current) {
      playTrack(nextTrack.url);
    }
  };

  // Previous Track
  const handlePrevTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrackIndex(prevIdx);
    localStorage.setItem("mn_music_track_index", String(prevIdx));

    const prevTrack = playlist[prevIdx];
    toast.success(`Now Playing: ${prevTrack.title} (${prevIdx + 1}/${playlist.length})`, {
      icon: "🎵",
      duration: 2500
    });

    if (audioRef.current) {
      playTrack(prevTrack.url);
    }
  };

  if (!enabled) return null;

  return (
    <div className="flex items-center gap-1 bg-gray-50/80 border border-gray-200/80 rounded-xl px-1.5 py-1 shadow-2xs">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`p-1.5 rounded-lg transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
          isPlaying
            ? "bg-brand-600 text-white shadow-xs"
            : "text-gray-500 hover:bg-gray-200/60 hover:text-gray-800"
        }`}
        title={isPlaying ? `Pause (${activeTrack?.title})` : `Play Ambient Music (${activeTrack?.title})`}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current" />
        )}
      </button>

      {/* Next Song Button */}
      <button
        type="button"
        onClick={handleNextTrack}
        className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-gray-200/60 transition-all active:scale-90 flex items-center justify-center cursor-pointer"
        title="Next Song (Click to change track)"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* Pulsing Music Indicator Pill */}
      {isPlaying && (
        <span
          onClick={handleNextTrack}
          className="text-[10px] font-semibold text-brand-700 bg-brand-50/90 border border-brand-200/60 px-2 py-0.5 rounded-md truncate max-w-[110px] hidden sm:inline-block cursor-pointer hover:bg-brand-100 transition-colors"
          title={`Playing: ${activeTrack?.title}. Click to switch song.`}
        >
          {activeTrack?.title}
        </span>
      )}
    </div>
  );
}
