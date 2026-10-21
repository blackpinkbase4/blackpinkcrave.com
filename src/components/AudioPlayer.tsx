"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AudioPlayer() {
  const [musicUrl, setMusicUrl] = useState<string>("");
  const [musicTitle, setMusicTitle] = useState<string>("");
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load ceremony soundtrack settings
  useEffect(() => {
    let mounted = true;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !data?.settings) return;
        const s = data.settings;
        if (s.music_url && s.music_url.trim() && s.music_enabled !== false) {
          setMusicUrl(s.music_url.trim());
          setMusicTitle(s.music_title || "Ceremony Soundtrack");
          setMusicEnabled(true);
        } else {
          setMusicEnabled(false);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Handle mobile and desktop autoplay unlock on first user gesture
  useEffect(() => {
    if (!musicUrl || !musicEnabled) return;
    const audio = audioRef.current;
    if (!audio) return;

    const startAudio = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = false;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {});
      window.removeEventListener("click", startAudio);
      window.removeEventListener("touchstart", startAudio);
    };

    // Try immediate autoplay (works on desktop if allowed)
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
      });

    // Listen on window for first tap or click anywhere on the page
    window.addEventListener("click", startAudio, { once: true });
    window.addEventListener("touchstart", startAudio, { once: true });

    return () => {
      window.removeEventListener("click", startAudio);
      window.removeEventListener("touchstart", startAudio);
    };
  }, [musicUrl, musicEnabled]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.muted = false;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Audio play blocked or invalid source:", err);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  // Only render if a real music URL is configured and enabled
  if (!musicEnabled || !musicUrl) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Native HTML5 Audio element inside DOM with mobile playsInline attributes */}
      <audio
        ref={audioRef}
        src={musicUrl}
        loop
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          console.warn("Audio element failed to load source:", musicUrl);
          setIsPlaying(false);
        }}
      />

      <button
        type="button"
        onClick={toggleSound}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-noir-950/95 backdrop-blur-md border border-white/20 text-white shadow-2xl hover:border-vma-mint transition-all text-xs font-mono group cursor-pointer active:scale-95"
        title={isPlaying ? "Click to mute/pause" : "Click to play song"}
        aria-label="Toggle Ceremony Soundtrack"
      >
        {isPlaying ? (
          <Volume2 className="w-4 h-4 text-vma-mint shrink-0" />
        ) : (
          <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
        )}

        <span className="text-[11px] font-semibold text-chrome-200 max-w-[120px] sm:max-w-[180px] truncate">
          {musicTitle || "Gala Soundtrack"}
        </span>

        <span
          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
            isPlaying ? "bg-vma-mint/20 text-vma-mint border border-vma-mint/30" : "bg-rose-950/60 text-rose-300 border border-rose-500/30"
          }`}
        >
          {isPlaying ? "PLAYING" : "MUTED"}
        </span>
      </button>
    </div>
  );
}
