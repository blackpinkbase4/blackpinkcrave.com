"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Clock, Sparkles, Flame, Crown, PartyPopper, Music, Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";
import { songPlayer } from "@/lib/songPlayer";

interface CountdownStageProps {
  targetIso: string;
  onCountdownComplete?: () => void;
  onStartManualPremiere?: () => void;
}

export const CountdownStage: React.FC<CountdownStageProps> = ({
  targetIso,
  onCountdownComplete,
  onStartManualPremiere,
}) => {
  const calculateTimeLeft = () => {
    const target = new Date(targetIso).getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { total: diff, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    setIsMusicPlaying(songPlayer.getIsPlaying());
    const handleSongUpdate = () => {
      setIsMusicPlaying(songPlayer.getIsPlaying());
    };
    window.addEventListener("song_player_state_changed", handleSongUpdate);
    return () => window.removeEventListener("song_player_state_changed", handleSongUpdate);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.total <= 0) {
        clearInterval(interval);
        if (onCountdownComplete) {
          onCountdownComplete();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetIso, onCountdownComplete]);

  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

  const triggerCelebrate = () => {
    try {
      confetti({
        particleCount: 140,
        spread: 110,
        origin: { y: 0.6 },
        colors: ["#facc15", "#ef4444", "#fbbf24", "#ffffff"],
      });
    } catch {}
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-8 relative z-30 animate-fade-in max-w-4xl mx-auto">
      {/* Golden Floating Trophy Badge */}
      <div className="relative">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-amber-500 p-1 shadow-vma-gold animate-bounce">
          <div className="w-full h-full bg-black rounded-[22px] flex items-center justify-center text-amber-300">
            <Trophy className="w-12 h-12" />
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-red-600 text-white p-2 rounded-full shadow-lg animate-pulse">
          <Flame className="w-4 h-4 fill-current" />
        </div>
      </div>

      {/* Main Ceremony Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/60 text-red-300 font-mono text-xs font-bold uppercase tracking-widest drop-shadow">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>OFFICIAL PREMIERE COUNTDOWN</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black uppercase text-white tracking-tight drop-shadow-[0_4px_25px_rgba(0,0,0,1)]">
          NOIR GALA <span className="text-vma-gold">'26</span>
        </h1>

        <p className="text-sm sm:text-base text-amber-200/90 font-mono max-w-2xl mx-auto drop-shadow leading-relaxed">
          The red carpet ceremony premiere officially goes live at the scheduled hour! 
          Get ready to witness all crowned winners, top contenders, and historic icons across the timeline.
        </p>
      </div>

      {/* Digital Giant Countdown Clock */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl">
        {/* Hours */}
        <div className="p-4 sm:p-6 rounded-3xl bg-black/85 border-2 border-amber-400/50 backdrop-blur-xl shadow-vma-gold flex flex-col items-center">
          <span className="text-4xl sm:text-7xl font-heading font-black text-amber-300 tracking-tight drop-shadow">
            {pad(timeLeft.hours)}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-chrome-400 uppercase tracking-widest mt-1">
            HOURS
          </span>
        </div>

        {/* Minutes */}
        <div className="p-4 sm:p-6 rounded-3xl bg-black/85 border-2 border-amber-400/50 backdrop-blur-xl shadow-vma-gold flex flex-col items-center">
          <span className="text-4xl sm:text-7xl font-heading font-black text-white tracking-tight drop-shadow">
            {pad(timeLeft.minutes)}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-chrome-400 uppercase tracking-widest mt-1">
            MINUTES
          </span>
        </div>

        {/* Seconds */}
        <div className="p-4 sm:p-6 rounded-3xl bg-black/85 border-2 border-red-500/60 backdrop-blur-xl shadow-2xl flex flex-col items-center">
          <span className="text-4xl sm:text-7xl font-heading font-black text-red-400 tracking-tight drop-shadow">
            {pad(timeLeft.seconds)}
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-chrome-400 uppercase tracking-widest mt-1">
            SECONDS
          </span>
        </div>
      </div>

      {/* Action Tools for Waiting Viewers */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {/* Play / Pause Ceremony Song */}
        <button
          type="button"
          onClick={() => songPlayer.toggle()}
          className={`px-6 py-2.5 rounded-full font-heading font-black text-xs uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95 backdrop-blur-md ${
            isMusicPlaying
              ? "bg-amber-400 text-black shadow-vma-gold"
              : "bg-black/80 hover:bg-black border border-amber-400/60 text-amber-300"
          }`}
        >
          {isMusicPlaying ? (
            <Volume2 className="w-4 h-4 animate-pulse text-black" />
          ) : (
            <Music className="w-4 h-4 text-amber-400" />
          )}
          <span>{isMusicPlaying ? "Pause Ceremony Track" : "Play Ceremony Track"}</span>
        </button>

        <button
          type="button"
          onClick={triggerCelebrate}
          className="px-6 py-2.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/60 text-amber-300 font-heading font-black text-xs uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95 backdrop-blur-md"
        >
          <PartyPopper className="w-4 h-4 text-amber-400" />
          <span>Celebrate (Confetti)</span>
        </button>

        {onStartManualPremiere && (
          <button
            type="button"
            onClick={onStartManualPremiere}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-heading font-black text-xs uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Clock className="w-4 h-4" />
            <span>Enter Premiere Broadcast</span>
          </button>
        )}
      </div>

      <span className="text-xs font-mono text-chrome-400 block pt-1">
        💬 Live chat & floating reactions are OPEN on the bottom-right!
      </span>
    </div>
  );
};
