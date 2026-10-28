"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  Crown,
  Sparkles,
  Share2,
  ExternalLink,
  ChevronRight,
  Clock,
  ArrowRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CategoryWinnerResult, NomineeResult } from "@/types";
import { songPlayer } from "@/lib/songPlayer";

interface LivePremiereBroadcastProps {
  categories: CategoryWinnerResult[];
  onFinishPremiere: () => void;
}

export const LivePremiereBroadcast: React.FC<LivePremiereBroadcastProps> = ({
  categories,
  onFinishPremiere,
}) => {
  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [stagePhase, setStagePhase] = useState<"nominees" | "drumroll" | "winner">("nominees");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    setIsMusicPlaying(songPlayer.getIsPlaying());
    const handleSongUpdate = () => {
      setIsMusicPlaying(songPlayer.getIsPlaying());
    };
    window.addEventListener("song_player_state_changed", handleSongUpdate);
    return () => window.removeEventListener("song_player_state_changed", handleSongUpdate);
  }, []);

  const currentCategory = categories[currentCatIndex] || categories[0];
  const nominees = currentCategory?.nominees || [];
  const winner: NomineeResult | undefined = nominees[0];
  const second: NomineeResult | undefined = nominees[1];
  const third: NomineeResult | undefined = nominees[2];
  const fourth: NomineeResult | undefined = nominees[3];
  const fifth: NomineeResult | undefined = nominees[4];

  // Duration for each phase (in seconds)
  const NOMINEES_DURATION = 4;
  const DRUMROLL_DURATION = 3;
  const WINNER_DURATION = 10;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Phase transition orchestrator
  useEffect(() => {
    if (isCompleted || !categories || categories.length === 0) return;

    // Phase 1: Nominees montage (4 seconds)
    setStagePhase("nominees");
    setPhaseSecondsLeft(NOMINEES_DURATION);

    // After 4s -> Phase 2: Drumroll (3 seconds)
    const t1 = setTimeout(() => {
      setStagePhase("drumroll");
      setPhaseSecondsLeft(DRUMROLL_DURATION);

      // After 3s -> Phase 3: Winner Reveal (10 seconds)
      const t2 = setTimeout(() => {
        setStagePhase("winner");
        setPhaseSecondsLeft(WINNER_DURATION);

        // Burst Celebration Gold & Crimson Confetti
        try {
          confetti({
            particleCount: 160,
            spread: 120,
            origin: { y: 0.55 },
            colors: ["#facc15", "#f59e0b", "#dc2626", "#ffffff", "#fbbf24"],
          });
        } catch {}

        // After 10s -> Next Category or Complete
        const t3 = setTimeout(() => {
          if (currentCatIndex < categories.length - 1) {
            setCurrentCatIndex((prev) => prev + 1);
          } else {
            setIsCompleted(true);
            try {
              confetti({
                particleCount: 220,
                spread: 140,
                origin: { y: 0.4 },
                colors: ["#facc15", "#ffffff", "#dc2626", "#fbbf24"],
              });
            } catch {}
          }
        }, WINNER_DURATION * 1000);

        timerRef.current = t3;
      }, DRUMROLL_DURATION * 1000);

      timerRef.current = t2;
    }, NOMINEES_DURATION * 1000);

    timerRef.current = t1;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentCatIndex, categories, isCompleted]);

  // Phase countdown tick down
  useEffect(() => {
    if (phaseSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setPhaseSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phaseSecondsLeft]);

  const handleSkipNext = () => {
    if (currentCatIndex < categories.length - 1) {
      setCurrentCatIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleTweetWinner = () => {
    if (!winner || !currentCategory) return;
    const text = `🏆 LIVE PREMIERE REVEAL! Huge congratulations to @${winner.x_username} for taking home 1ST PLACE in ${currentCategory.category_title} at the Noir Gala '26! 🌟 #NoirGala26 #OneTimelineEveryFandom`;
    const shareUrl = "https://blackpinkcrave.com";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  // Grand Finale View
  if (isCompleted) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 space-y-6 relative z-30 animate-fade-in max-w-4xl mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 p-1 shadow-vma-gold animate-bounce">
          <div className="w-full h-full bg-black rounded-[20px] flex items-center justify-center text-amber-300">
            <Trophy className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2 max-w-2xl">
          <span className="px-4 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold uppercase tracking-widest">
            ★ ALL {categories.length} CATEGORIES OFFICIALLY REVEALED ★
          </span>
          <h2 className="text-4xl sm:text-6xl font-heading font-black uppercase text-white tracking-tight drop-shadow-[0_4px_25px_rgba(0,0,0,1)]">
            THE CEREMONY PREMIERE HAS CONCLUDED!
          </h2>
          <p className="text-sm text-chrome-200 font-mono leading-relaxed">
            Thank you for celebrating with us! Congratulations to all crowned winners, top contenders, and creators across the timeline.
          </p>
        </div>

        <button
          type="button"
          onClick={onFinishPremiere}
          className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-heading font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-vma-gold transition-all hover:scale-105 active:scale-95"
        >
          <span>Explore Full Hall of Fame Archive</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!currentCategory) {
    return null;
  }

  return (
    <div className="relative min-h-[75vh] flex flex-col justify-between p-4 sm:p-8 max-w-5xl mx-auto z-30">
      {/* Top Broadcast HUD / Status Bar */}
      <div className="flex items-center justify-between border-b border-amber-400/30 pb-3 gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
          <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/60 text-red-300 font-mono text-[11px] font-black uppercase tracking-widest">
            LIVE PREMIERE BROADCAST
          </span>
          <span className="font-heading font-black text-xs sm:text-sm text-amber-300 uppercase tracking-wider truncate">
            CATEGORY {currentCatIndex + 1} OF {categories.length}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Song Player Toggle */}
          <button
            type="button"
            onClick={() => songPlayer.toggle()}
            className={`px-3 py-1.5 rounded-full border text-xs font-mono uppercase flex items-center gap-1.5 transition-all shadow-md ${
              isMusicPlaying
                ? "bg-amber-400 text-black border-amber-300 font-bold shadow-vma-gold"
                : "bg-black/60 hover:bg-black/90 border-white/20 text-chrome-300"
            }`}
            title={isMusicPlaying ? "Pause Ceremony Track" : "Play Ceremony Track"}
          >
            {isMusicPlaying ? (
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-black" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-chrome-400" />
            )}
            <span className="hidden sm:inline">{isMusicPlaying ? "Song: ON" : "Song: OFF"}</span>
          </button>

          {/* Quick Skip Button */}
          <button
            type="button"
            onClick={handleSkipNext}
            className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-chrome-300 hover:text-white font-mono text-[11px] uppercase flex items-center gap-1 transition-colors"
          >
            <span>Skip</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Jump directly to Hall of Fame Archive */}
          <button
            type="button"
            onClick={onFinishPremiere}
            className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-heading font-black text-[11px] uppercase flex items-center gap-1.5 shadow-vma-gold transition-all"
            title="Open Full Hall of Fame Podium"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hall of Fame</span>
            <span>Podium</span>
          </button>
        </div>
      </div>

      {/* Category Title Header */}
      <div className="text-center py-3 space-y-1">
        <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block drop-shadow">
          NOW PRESENTING CATEGORY:
        </span>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black uppercase text-white tracking-tight drop-shadow-[0_4px_25px_rgba(0,0,0,1)]">
          {currentCategory.category_title}
        </h2>
      </div>

      {/* STAGE PHASES */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        {stagePhase === "nominees" && (
          /* PHASE 1: Nominees Montage */
          <div className="text-center space-y-6 animate-fade-in w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-amber-400/50 text-amber-300 font-mono text-xs uppercase tracking-widest drop-shadow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OFFICIAL FINALISTS & CONTENDERS</span>
            </div>

            {/* Quick Nominee Avatar Parade with Rank Tags */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-3">
              {nominees.slice(0, 5).map((nom, i) => (
                <div key={nom.nominee_id} className="flex flex-col items-center space-y-1.5 animate-scale-up">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black border-2 border-white/25 shadow-lg relative">
                    {nom.avatar_url ? (
                      <img
                        src={nom.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          const fb = document.getElementById(`live-avatar-fb-${nom.nominee_id}`);
                          if (fb) fb.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      id={`live-avatar-fb-${nom.nominee_id}`}
                      className={`w-full h-full flex items-center justify-center font-heading font-black text-2xl text-amber-300 ${
                        nom.avatar_url ? "hidden" : "flex"
                      }`}
                    >
                      {nom.display_name.charAt(0) || "★"}
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 border border-amber-400/50 text-amber-300 text-[9px] font-mono font-bold px-1 rounded">
                      #{i + 1}
                    </span>
                  </div>
                  <span className="font-heading font-bold text-xs text-white uppercase max-w-[85px] truncate block drop-shadow">
                    {nom.display_name}
                  </span>
                  <span className="text-[10px] font-mono text-chrome-400 uppercase">
                    Finalist
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs font-mono text-amber-200/80 tracking-widest uppercase">
              REVEALING 1ST PLACE WINNER IN 0{phaseSecondsLeft}s...
            </p>
          </div>
        )}

        {stagePhase === "drumroll" && (
          /* PHASE 2: Suspense Drumroll */
          <div className="text-center space-y-6 animate-pulse w-full max-w-md">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-black/80 border-4 border-amber-400 flex items-center justify-center shadow-vma-gold">
              <Trophy className="w-12 h-12 text-amber-300 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl sm:text-5xl font-heading font-black uppercase text-amber-300 tracking-wider drop-shadow-[0_4px_20px_rgba(245,158,11,0.6)]">
                AND THE WINNER IS...
              </h3>
              <p className="text-xs font-mono text-chrome-300 tracking-widest uppercase">
                UNSEALING THE NOIR CEREMONY ENVELOPE...
              </p>
            </div>
          </div>
        )}

        {stagePhase === "winner" && winner && (
          /* PHASE 3: CROWNED WINNER EXPLOSION */
          <div className="w-full max-w-3xl space-y-4 text-center animate-scale-up">
            {/* Center Countdown to Next Winner */}
            <div className="mx-auto inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-heading font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl animate-pulse border-2 border-white/40">
              <Clock className="w-4 h-4 animate-spin" />
              <span>⏳ NEXT CATEGORY IN {phaseSecondsLeft < 10 ? `0${phaseSecondsLeft}` : phaseSecondsLeft}s...</span>
            </div>

            {/* The Champion Reveal Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-black/85 border-2 border-amber-400 shadow-vma-gold backdrop-blur-xl relative overflow-hidden">
              {/* Winner Crown Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-heading font-black text-xs uppercase shadow-vma-gold tracking-widest mb-3">
                <Crown className="w-4 h-4 fill-current animate-bounce" />
                <span>👑 CROWNED 1ST PLACE WINNER</span>
              </div>

              {/* Large Avatar */}
              <div className="relative mx-auto w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden bg-black border-4 border-amber-400 shadow-vma-gold ring-4 ring-amber-400/40 my-2">
                {winner.avatar_url ? (
                  <img
                    src={winner.avatar_url}
                    alt={winner.display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                      const fb = document.getElementById(`live-winner-fb-${winner.nominee_id}`);
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  id={`live-winner-fb-${winner.nominee_id}`}
                  className={`w-full h-full flex items-center justify-center font-heading font-black text-5xl text-amber-300 ${
                    winner.avatar_url ? "hidden" : "flex"
                  }`}
                >
                  {winner.display_name.charAt(0) || "★"}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-black p-2 rounded-full shadow-lg">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
              </div>

              {/* Name & Handle */}
              <div className="space-y-1 mt-2">
                <h3 className="font-heading font-black text-2xl sm:text-4xl text-white uppercase tracking-tight drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                  {winner.display_name}
                </h3>
                <a
                  href={`https://x.com/${winner.x_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-300 hover:underline font-mono text-sm drop-shadow"
                >
                  <span>@{winner.x_username}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Clean Option A Trophy Banner (Hiding raw vote numbers) */}
              <div className="inline-block font-mono text-xs sm:text-sm text-amber-300 bg-amber-400/10 py-1.5 px-5 rounded-2xl border border-amber-400/40 mt-3 shadow-inner font-bold uppercase tracking-wider">
                🏆 OFFICIAL 2026 CATEGORY CHAMPION
              </div>

              {/* Instant Tweet Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleTweetWinner}
                  className="px-5 py-2 rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-heading font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Tweet Victory Congratulations</span>
                </button>
              </div>
            </div>

            {/* Runners-Up & Top Contenders (Option A: Clean Showcase) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono text-amber-300/80 uppercase tracking-widest block font-bold">
                ★ RUNNERS-UP & TOP CONTENDERS ★
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
                {second && (
                  <div className="p-2.5 rounded-2xl bg-black/70 border border-slate-300/60 backdrop-blur-md text-left space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-black font-black text-[9px] uppercase tracking-wider inline-block">
                      #2 • FINALIST
                    </span>
                    <span className="font-heading font-black text-xs text-white uppercase truncate block">
                      {second.display_name}
                    </span>
                    <span className="font-mono text-[10px] text-chrome-400 truncate block">
                      @{second.x_username}
                    </span>
                  </div>
                )}

                {third && (
                  <div className="p-2.5 rounded-2xl bg-black/70 border border-amber-600/60 backdrop-blur-md text-left space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider inline-block">
                      #3 • FINALIST
                    </span>
                    <span className="font-heading font-black text-xs text-white uppercase truncate block">
                      {third.display_name}
                    </span>
                    <span className="font-mono text-[10px] text-chrome-400 truncate block">
                      @{third.x_username}
                    </span>
                  </div>
                )}

                {fourth && (
                  <div className="p-2.5 rounded-2xl bg-black/70 border border-white/20 backdrop-blur-md text-left space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-700 text-chrome-200 font-black text-[9px] uppercase tracking-wider inline-block">
                      #4 • FINALIST
                    </span>
                    <span className="font-heading font-black text-xs text-white uppercase truncate block">
                      {fourth.display_name}
                    </span>
                    <span className="font-mono text-[10px] text-chrome-400 truncate block">
                      @{fourth.x_username}
                    </span>
                  </div>
                )}

                {fifth && (
                  <div className="p-2.5 rounded-2xl bg-black/70 border border-white/20 backdrop-blur-md text-left space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-700 text-chrome-200 font-black text-[9px] uppercase tracking-wider inline-block">
                      #5 • FINALIST
                    </span>
                    <span className="font-heading font-black text-xs text-white uppercase truncate block">
                      {fifth.display_name}
                    </span>
                    <span className="font-mono text-[10px] text-chrome-400 truncate block">
                      @{fifth.x_username}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar */}
      <div className="border-t border-amber-400/20 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-chrome-300">
        <span>
          Category {currentCatIndex + 1} of {categories.length}
        </span>
        <button
          type="button"
          onClick={onFinishPremiere}
          className="text-amber-300 hover:text-amber-200 underline uppercase font-bold text-[11px] tracking-wider transition-colors"
        >
          Skip All to Full Podium 🏆
        </button>
        <span className="text-amber-300 font-bold">
          {stagePhase === "winner" ? `⏳ Next Reveal in 0${phaseSecondsLeft}s` : "Announcing..."}
        </span>
      </div>
    </div>
  );
};
