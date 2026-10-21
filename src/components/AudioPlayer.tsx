"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

export function AudioPlayer() {
  const [musicUrl, setMusicUrl] = useState<string>("");
  const [musicTitle, setMusicTitle] = useState<string>("");
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch event settings for daily soundtrack
  useEffect(() => {
    let mounted = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !data?.settings) return;
        const s = data.settings;
        if (s.music_url && s.music_enabled !== false) {
          setMusicUrl(s.music_url);
          setMusicTitle(s.music_title || "Gala Soundtrack");
          setMusicEnabled(true);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize and handle autoplay
  useEffect(() => {
    if (!musicUrl || !musicEnabled) return;

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.65;
    audioRef.current = audio;

    // Attempt autoplay immediately
    const startAudio = () => {
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          // Remove listener once successfully playing
          window.removeEventListener("click", startAudio);
          window.removeEventListener("touchstart", startAudio);
        })
        .catch(() => {
          // Browser autoplay policy blocked it; wait for first user gesture
          setIsPlaying(false);
        });
    };

    startAudio();

    // Listen for first interaction to unlock audio
    window.addEventListener("click", startAudio, { once: true });
    window.addEventListener("touchstart", startAudio, { once: true });

    return () => {
      window.removeEventListener("click", startAudio);
      window.removeEventListener("touchstart", startAudio);
      audio.pause();
      audio.src = "";
    };
  }, [musicUrl, musicEnabled]);

  const toggleSound = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsMuted(false);
      });
    } else {
      if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      } else {
        audioRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  if (!musicEnabled || !musicUrl) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        type="button"
        onClick={toggleSound}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-noir-900/90 backdrop-blur-md border border-white/15 text-white shadow-xl hover:border-vma-mint/50 transition-all text-xs font-mono group cursor-pointer"
        title={isMuted || !isPlaying ? "Click to play sound" : "Click to mute sound"}
        aria-label="Toggle Ceremony Soundtrack"
      >
        {isMuted || !isPlaying ? (
          <VolumeX className="w-4 h-4 text-chrome-400 group-hover:text-white" />
        ) : (
          <Volume2 className="w-4 h-4 text-vma-mint" />
        )}

        <span className="text-[11px] font-semibold text-chrome-300 max-w-[140px] sm:max-w-[200px] truncate">
          {musicTitle}
        </span>

        <span className="text-[10px] uppercase font-bold text-chrome-500">
          {isMuted || !isPlaying ? "MUTED" : "ON"}
        </span>
      </button>
    </div>
  );
}
