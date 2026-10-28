"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { songPlayer, isCurrentPageAdmin } from "@/lib/songPlayer";

export const GlobalSongPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWinners, setIsWinners] = useState(false);

  useEffect(() => {
    setIsAdmin(isCurrentPageAdmin());
    setIsWinners(typeof window !== "undefined" && window.location.pathname.startsWith("/winners"));

    const updateState = () => {
      setIsPlaying(songPlayer.getIsPlaying());
      setIsAdmin(isCurrentPageAdmin());
      setIsWinners(typeof window !== "undefined" && window.location.pathname.startsWith("/winners"));
    };

    window.addEventListener("song_player_state_changed", updateState);

    // Multi-event first user interaction unlocker across the entire site
    const handleFirstInteraction = () => {
      if (!isCurrentPageAdmin() && !songPlayer.getIsPlaying()) {
        songPlayer.play();
      }
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("pointerdown", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener("song_player_state_changed", updateState);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  // Never render audio controller on admin desk or winners page (which has its own hero audio control)
  if (isAdmin || isWinners) return null;

  return (
    <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 z-40">
      <button
        type="button"
        onClick={() => {
          songPlayer.toggle();
        }}
        className={`px-3 py-1.5 rounded-full font-heading font-black text-[10px] sm:text-xs uppercase flex items-center gap-1.5 shadow-lg backdrop-blur-md border transition-all active:scale-95 ${
          isPlaying
            ? "bg-amber-400 text-black border-amber-300 shadow-vma-gold animate-pulse"
            : "bg-black/85 text-amber-300/80 hover:text-amber-300 border-amber-400/40 hover:bg-black"
        }`}
        title={isPlaying ? "Mute Ceremony Track" : "Play Ceremony Track"}
      >
        {isPlaying ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">Sound ON</span>
            <span className="inline-flex items-end gap-0.5 h-3 ml-0.5">
              <span className="w-0.5 h-2.5 bg-black animate-[pulse_0.6s_ease-in-out_infinite]" />
              <span className="w-0.5 h-3.5 bg-black animate-[pulse_0.4s_ease-in-out_infinite]" />
              <span className="w-0.5 h-1.5 bg-black animate-[pulse_0.8s_ease-in-out_infinite]" />
            </span>
          </>
        ) : (
          <>
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Play Track</span>
          </>
        )}
      </button>
    </div>
  );
};
