"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Lock,
  Trophy,
  Award,
  Sparkles,
  ExternalLink,
  Share2,
  Calendar,
  Download,
  Music,
  Volume2,
  VolumeX,
  PartyPopper,
  Radio,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CategoryWinnerResult, NomineeResult } from "@/types";
import { playClickSound, playVoteSuccessSound } from "@/lib/sound";
import { songPlayer } from "@/lib/songPlayer";
import { CountdownStage } from "@/components/CountdownStage";
import { LivePremiereBroadcast } from "@/components/LivePremiereBroadcast";
import { LiveChatReactions } from "@/components/LiveChatReactions";

export default function WinnersPage() {
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [ceremonyMode, setCeremonyMode] = useState<"countdown" | "live" | "unlocked">("countdown");
  const [countdownTarget, setCountdownTarget] = useState("2026-10-31T17:30:00+05:30");
  const [results, setResults] = useState<CategoryWinnerResult[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Hidden Canvas for rendering downloadable winner graphic
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMusicPlaying(songPlayer.getIsPlaying());
    const handleSongUpdate = () => {
      setIsMusicPlaying(songPlayer.getIsPlaying());
    };
    window.addEventListener("song_player_state_changed", handleSongUpdate);
    return () => window.removeEventListener("song_player_state_changed", handleSongUpdate);
  }, []);

  useEffect(() => {
    async function fetchWinners() {
      try {
        const res = await fetch("/api/winners", { cache: "no-store" });
        const data = await res.json();

        setPublished(Boolean(data.published));
        if (data.ceremony_mode) {
          setCeremonyMode(data.ceremony_mode);
        }
        if (data.countdown_target) {
          setCountdownTarget(data.countdown_target);
        }
        if (data.results) {
          setResults(data.results);
        }
      } catch {}
      finally {
        setLoading(false);
      }
    }
    fetchWinners();
  }, []);

  const handleShareToX = (categoryTitle: string, nominee: NomineeResult, rank = 1) => {
    playClickSound();
    const rankTitle =
      rank === 1
        ? "1ST PLACE WINNER 🏆"
        : rank === 2
        ? "RUNNER-UP 🥈"
        : rank === 3
        ? "3RD PLACE FINALIST 🥉"
        : `#${rank} FINALIST ★`;

    const text = `Official Noir Gala '26 Accolade! Congratulations to @${nominee.x_username} for taking ${rankTitle} in ${categoryTitle}! #NoirGala26 #OneTimelineEveryFandom`;
    const url = typeof window !== "undefined" ? window.location.origin : "https://blackpinkcrave.com";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  /**
   * Generates a high-res VMA Award graphic on HTML5 Canvas and downloads as PNG
   * Supports Winner (1st), Runner-Up (2nd), 3rd Place, and all participating Finalists!
   * Clean Option A: Highlights official championship and position without raw vote numbers!
   */
  const handleDownloadCard = async (
    categoryTitle: string,
    nominee: NomineeResult,
    rank = 1
  ) => {
    playClickSound();
    setDownloadingId(nominee.nominee_id);

    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350; // Instagram / Twitter portrait aspect ratio (4:5)
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isWinner = rank === 1;
      const isRunnerUp = rank === 2;
      const isThird = rank === 3;

      // Color scheme & titles based on standing position
      const headerTitle = isWinner
        ? "★ OFFICIAL 2026 WINNER ACCOLADE ★"
        : isRunnerUp
        ? "★ OFFICIAL 2026 RUNNER-UP ACCOLADE ★"
        : isThird
        ? "★ OFFICIAL 2026 3RD PLACE ACCOLADE ★"
        : `★ OFFICIAL 2026 FINALIST #${rank} ACCOLADE ★`;

      const pillTitle = isWinner
        ? "🏆 1ST PLACE WINNER"
        : isRunnerUp
        ? "🥈 2ND PLACE / RUNNER-UP"
        : isThird
        ? "🥉 3RD PLACE FINALIST"
        : `★ #${rank} PLACE FINALIST`;

      const pillBg = isWinner
        ? "#facc15"
        : isRunnerUp
        ? "#e2e8f0"
        : isThird
        ? "#f97316"
        : "#38bdf8";

      const pillTextColor = isWinner || isRunnerUp ? "#07080c" : "#ffffff";
      const borderAccent = isWinner
        ? "#eab308"
        : isRunnerUp
        ? "#94a3b8"
        : isThird
        ? "#ea580c"
        : "#0284c7";

      const standingSubtitle = isWinner
        ? "OFFICIAL 2026 CATEGORY CHAMPION // VERIFIED BALLOT"
        : isRunnerUp
        ? "OFFICIAL 2026 CATEGORY RUNNER-UP // VERIFIED BALLOT"
        : isThird
        ? "OFFICIAL 2026 CATEGORY 3RD PLACE // VERIFIED BALLOT"
        : `OFFICIAL 2026 CATEGORY #${rank} FINALIST // VERIFIED BALLOT`;

      // 1. Dark Midnight Background
      ctx.fillStyle = "#07080c";
      ctx.fillRect(0, 0, 1080, 1350);

      // 2. Theatrical Stage Gradient & Glow
      const grad = ctx.createRadialGradient(540, 450, 80, 540, 500, 750);
      if (isWinner) {
        grad.addColorStop(0, "rgba(234, 179, 8, 0.25)");
        grad.addColorStop(0.5, "rgba(225, 29, 72, 0.15)");
      } else if (isRunnerUp) {
        grad.addColorStop(0, "rgba(148, 163, 184, 0.25)");
        grad.addColorStop(0.5, "rgba(56, 189, 248, 0.12)");
      } else if (isThird) {
        grad.addColorStop(0, "rgba(249, 115, 22, 0.25)");
        grad.addColorStop(0.5, "rgba(180, 83, 9, 0.15)");
      } else {
        grad.addColorStop(0, "rgba(56, 189, 248, 0.2)");
        grad.addColorStop(0.5, "rgba(30, 41, 59, 0.2)");
      }
      grad.addColorStop(1, "rgba(7, 8, 12, 1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);

      // 3. Top Header: Noir Gala VMA Branding
      ctx.fillStyle = isWinner ? "#facc15" : isRunnerUp ? "#e2e8f0" : isThird ? "#fb923c" : "#38bdf8";
      ctx.font = "bold 26px 'JetBrains Mono', monospace";
      ctx.fillText(headerTitle, 60, 90);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 64px 'Syne', 'Oswald', sans-serif";
      ctx.fillText("NOIR GALA '26", 60, 160);

      // Category Pill
      ctx.fillStyle = "#1e283c";
      ctx.roundRect(60, 190, 960, 75, 16);
      ctx.fill();
      ctx.strokeStyle = borderAccent;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isWinner ? "#facc15" : "#38bdf8";
      ctx.font = "bold 32px 'JetBrains Mono', monospace";
      ctx.fillText(`CATEGORY: ${categoryTitle.toUpperCase()}`, 90, 240);

      // 4. Nominee Photo Box
      const photoBoxY = 295;
      const photoBoxW = 960;
      const photoBoxH = 680;

      let imageDrawn = false;
      if (nominee.avatar_url) {
        const img = new Image();
        let srcToLoad = nominee.avatar_url;

        // If remote URL, route through same-origin image-proxy to prevent canvas CORS security blocks
        if (srcToLoad.startsWith("http://") || srcToLoad.startsWith("https://")) {
          srcToLoad = `/api/image-proxy?url=${encodeURIComponent(srcToLoad)}`;
          img.crossOrigin = "anonymous";
        }
        // For data: URIs, never set crossOrigin (which causes Chrome security aborts on base64)

        await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = srcToLoad;
        });

        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(60, photoBoxY, photoBoxW, photoBoxH, 24);
          ctx.clip();

          // Aspect-ratio cover math: preserves portrait proportions without distortion
          const imgAspect = img.naturalWidth / img.naturalHeight;
          const boxAspect = photoBoxW / photoBoxH;
          let renderW = photoBoxW;
          let renderH = photoBoxH;
          let offsetX = 60;
          let offsetY = photoBoxY;

          if (imgAspect > boxAspect) {
            renderW = photoBoxH * imgAspect;
            offsetX = 60 - (renderW - photoBoxW) / 2;
          } else {
            renderH = photoBoxW / imgAspect;
            offsetY = photoBoxY - (renderH - photoBoxH) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
          ctx.restore();
          imageDrawn = true;
        }
      }

      if (!imageDrawn) {
        // Luxury VIP monogram placeholder if no avatar provided
        ctx.fillStyle = "#131824";
        ctx.fillRect(60, photoBoxY, photoBoxW, photoBoxH);
        ctx.fillStyle = isWinner ? "#facc15" : "#38bdf8";
        ctx.font = "900 140px 'Syne', 'Oswald', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          (nominee.display_name.trim().charAt(0) || "★").toUpperCase(),
          60 + photoBoxW / 2,
          photoBoxY + photoBoxH / 2
        );
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }

      // Dark gradient overlay at bottom of photo
      const photoGrad = ctx.createLinearGradient(0, photoBoxY + 300, 0, photoBoxY + photoBoxH);
      photoGrad.addColorStop(0, "rgba(7, 8, 12, 0)");
      photoGrad.addColorStop(1, "rgba(7, 8, 12, 0.95)");
      ctx.fillStyle = photoGrad;
      ctx.fillRect(60, photoBoxY, photoBoxW, photoBoxH);

      // Position Pill Stamp inside photo
      ctx.fillStyle = pillBg;
      ctx.fillRect(90, photoBoxY + photoBoxH - 120, 360, 48);
      ctx.fillStyle = pillTextColor;
      ctx.font = "900 24px 'Oswald', sans-serif";
      ctx.fillText(pillTitle, 105, photoBoxY + photoBoxH - 88);

      // Nominee Name Overlay
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 52px 'Syne', 'Oswald', sans-serif";
      ctx.fillText(nominee.display_name, 90, photoBoxY + photoBoxH - 30);

      // 5. Bottom Info Bar
      const bottomY = photoBoxY + photoBoxH + 40;
      ctx.fillStyle = "#121722";
      ctx.roundRect(60, bottomY, photoBoxW, 200, 20);
      ctx.fill();
      ctx.strokeStyle = borderAccent;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isWinner ? "#facc15" : isRunnerUp ? "#e2e8f0" : "#38bdf8";
      ctx.font = "bold 38px 'JetBrains Mono', monospace";
      ctx.fillText(`@${nominee.x_username}`, 100, bottomY + 70);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText(standingSubtitle, 100, bottomY + 130);

      ctx.fillStyle = "#64748b";
      ctx.font = "20px 'JetBrains Mono', monospace";
      ctx.fillText("ONE TIMELINE. EVERY FANDOM. // BLACKPINKCRAVE.COM", 100, bottomY + 170);

      // Trigger file download
      playVoteSuccessSound();
      const link = document.createElement("a");
      link.download = isWinner
        ? `Noir_Gala_2026_Winner_${nominee.x_username}.png`
        : `Noir_Gala_2026_Finalist_Rank${rank}_${nominee.x_username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
    } finally {
      setDownloadingId(null);
    }
  };

  const triggerCelebrate = () => {
    try {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 },
        colors: ["#facc15", "#e11d48", "#38bdf8", "#ffffff"],
      });
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-28 px-4 text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-widest text-chrome-400">Loading Ceremony Stage...</p>
      </div>
    );
  }

  // =========================================================================
  // CEREMONY STAGE 1: COUNTDOWN WAITING ROOM
  // =========================================================================
  if (!published || ceremonyMode === "countdown") {
    return (
      <div className="relative">
        <CountdownStage
          targetIso={countdownTarget}
          onCountdownComplete={() => setCeremonyMode("live")}
          onStartManualPremiere={published ? () => setCeremonyMode("live") : undefined}
        />
        <LiveChatReactions />
      </div>
    );
  }

  // =========================================================================
  // CEREMONY STAGE 2: LIVE PREMIERE BROADCAST (1-BY-1 REVEAL)
  // =========================================================================
  if (ceremonyMode === "live") {
    return (
      <div className="relative">
        <LivePremiereBroadcast
          categories={results}
          onFinishPremiere={() => setCeremonyMode("unlocked")}
        />
        <LiveChatReactions />
      </div>
    );
  }

  // =========================================================================
  // CEREMONY STAGE 3: FULL HALL OF FAME PODIUM ARCHIVE (OPTION A)
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 relative">
      {/* Hidden canvas for downloading */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Live Chat & Reactions */}
      <LiveChatReactions />

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold uppercase tracking-widest shadow-vma-gold">
          <Sparkles className="w-4 h-4" />
          <span>OFFICIAL 2026 WINNERS PODIUM</span>
        </div>
        <h1 className="text-4xl sm:text-7xl font-heading font-black uppercase text-white tracking-tight">
          THE 2026 CHAMPIONS
        </h1>
        <p className="text-xs sm:text-sm text-chrome-400 font-mono max-w-xl mx-auto">
          Verified winners across Stan Twitter. Congratulations to the icons who ruled the timeline!
        </p>

        {/* Total Ceremony Votes (Mentioned Only Above at the Top) */}
        <div className="flex items-center justify-center pt-1 font-mono text-xs">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold uppercase tracking-wider shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>TOTAL VERIFIED BALLOTS: {results.reduce((sum, c) => sum + (c.total_votes || 0), 0).toLocaleString()} VOTES</span>
          </div>
        </div>

        {/* Global Controls: Play Ceremony Song & Replay Broadcast */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => songPlayer.toggle()}
            className={`px-5 py-2 rounded-full font-heading font-black text-xs uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
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
            <span>{isMusicPlaying ? "Pause Track" : "Play Ceremony Track"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCeremonyMode("live")}
            className="px-5 py-2 rounded-full bg-red-600/30 hover:bg-red-600/50 border border-red-500/60 text-red-300 font-heading font-black text-xs uppercase flex items-center gap-2 transition-all active:scale-95"
          >
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Replay Live Premiere Broadcast</span>
          </button>

          <button
            type="button"
            onClick={triggerCelebrate}
            className="px-5 py-2 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/60 text-amber-300 font-heading font-black text-xs uppercase flex items-center gap-2 transition-all active:scale-95"
          >
            <PartyPopper className="w-4 h-4 text-amber-400" />
            <span>Celebrate</span>
          </button>
        </div>
      </div>

      {/* Winners & Finalists Cards Grid (Clean Option A - No Vote Counts) */}
      <div className="space-y-16">
        {results.map((category) => {
          const winners =
            category.winners && category.winners.length > 0
              ? category.winners
              : category.nominees.slice(0, 1);

          const winnerIds = new Set(winners.map((w) => w.nominee_id));
          const contenders = category.nominees.filter((n) => !winnerIds.has(n.nominee_id));

          return (
            <div
              key={category.category_id}
              className="p-6 sm:p-8 rounded-3xl bg-black/80 border-2 border-amber-400/40 shadow-2xl space-y-8 backdrop-blur-xl"
            >
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    AWARD ACCOLADE
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight">
                    {category.category_title}
                  </h2>
                </div>
                <div className="font-mono text-xs text-amber-300/80 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                  🏆 VERIFIED 2026 CATEGORY
                </div>
              </div>

              {/* 1. Champion Winners (1st Place) */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>CROWNED 1ST PLACE CHAMPION</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {winners.map((winner) => (
                    <div
                      key={winner.nominee_id}
                      className="rounded-3xl overflow-hidden bg-black/90 border-2 border-amber-400 shadow-vma-gold space-y-4 flex flex-col justify-between"
                    >
                      {/* Photo Top */}
                      <div className="relative aspect-[4/3] w-full bg-noir-850 overflow-hidden">
                        {winner.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={winner.avatar_url}
                            alt={winner.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-noir-800 font-heading font-black text-6xl text-amber-400">
                            {winner.display_name.charAt(0)}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                        {/* Winner Pill */}
                        <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-mono text-xs font-black uppercase tracking-wider shadow-vma-gold flex items-center gap-1.5">
                          <span>🏆 1ST PLACE WINNER</span>
                        </div>

                        {/* Name inside Photo */}
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                          <h3 className="font-heading font-black text-2xl sm:text-3xl text-white drop-shadow">
                            {winner.display_name}
                          </h3>
                          <a
                            href={`https://x.com/${winner.x_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-amber-300 hover:underline flex items-center gap-1 drop-shadow"
                          >
                            <span>@{winner.x_username}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Clean Option A Accolade Tag */}
                      <div className="px-6 py-2 flex items-center justify-between font-mono text-xs border-y border-white/5">
                        <span className="text-chrome-400">Ceremony Standing:</span>
                        <span className="text-amber-300 font-bold text-sm">
                          👑 OFFICIAL CHAMPION
                        </span>
                      </div>

                      {/* Downloadable Picture Button & Share Button */}
                      <div className="p-4 bg-black/95 border-t border-amber-400/20 flex flex-col sm:flex-row items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadCard(category.category_title, winner, 1)}
                          disabled={downloadingId === winner.nominee_id}
                          className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-vma-gold transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>
                            {downloadingId === winner.nominee_id
                              ? "RENDERING GRAPHIC..."
                              : "DOWNLOAD WINNER CARD (PNG)"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareToX(category.category_title, winner, 1)}
                          className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/15 transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-amber-300" />
                          <span>SHARE TO X</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. All Category Contenders & Runners-Up (Every Participant with Download Card) */}
              {contenders.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-chrome-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-vma-mint" />
                      <span>CATEGORY CONTENDERS, RUNNERS-UP & FINALISTS</span>
                    </span>
                    <span className="text-[10px] font-mono text-chrome-500">
                      Cards available for every verified participant
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contenders.map((nominee, idx) => {
                      const rank = idx + 2; // Runner-up is #2, 3rd place is #3, etc.
                      const isRunnerUp = rank === 2;
                      const isThird = rank === 3;

                      return (
                        <div
                          key={nominee.nominee_id}
                          className={`rounded-2xl overflow-hidden bg-black/85 flex flex-col justify-between border transition-all ${
                            isRunnerUp
                              ? "border-slate-400/60 shadow-lg"
                              : isThird
                              ? "border-amber-600/60 shadow-lg"
                              : "border-white/10 hover:border-white/25"
                          }`}
                        >
                          {/* Photo & Rank Pill */}
                          <div className="relative aspect-[16/10] w-full bg-noir-850 overflow-hidden">
                            {nominee.avatar_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={nominee.avatar_url}
                                alt={nominee.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-noir-800 font-heading font-black text-4xl text-chrome-400">
                                {nominee.display_name.charAt(0)}
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                            {/* Position Badge */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              {isRunnerUp ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 font-mono text-[10px] font-black uppercase tracking-wider shadow">
                                  🥈 #2 • RUNNER-UP
                                </span>
                              ) : isThird ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow">
                                  🥉 #3 • 3RD PLACE
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-chrome-200 font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                                  ★ #{rank} • FINALIST
                                </span>
                              )}
                            </div>

                            {/* Nominee Name Overlay */}
                            <div className="absolute bottom-2.5 left-3 right-3 z-10">
                              <h4 className="font-heading font-black text-lg text-white truncate drop-shadow">
                                {nominee.display_name}
                              </h4>
                              <a
                                href={`https://x.com/${nominee.x_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] text-chrome-300 hover:text-white hover:underline flex items-center gap-1 drop-shadow"
                              >
                                <span>@{nominee.x_username}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>

                          {/* Standing Status (NO Vote Numbers) */}
                          <div className="px-3.5 py-1.5 flex items-center justify-between font-mono text-[11px] border-y border-white/5 bg-black/60">
                            <span className="text-chrome-400">Ceremony Standing:</span>
                            <span
                              className={`font-bold ${
                                isRunnerUp
                                  ? "text-slate-300"
                                  : isThird
                                  ? "text-amber-500"
                                  : "text-chrome-300"
                              }`}
                            >
                              {isRunnerUp
                                ? "RUNNER-UP"
                                : isThird
                                ? "3RD PLACE"
                                : `FINALIST #${rank}`}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-3 bg-black/95 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadCard(category.category_title, nominee, rank)}
                              disabled={downloadingId === nominee.nominee_id}
                              className={`flex-1 py-2 px-3 rounded-xl font-heading font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow ${
                                isRunnerUp
                                  ? "bg-slate-200 hover:bg-white text-slate-900"
                                  : isThird
                                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                                  : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                              }`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>
                                {downloadingId === nominee.nominee_id
                                  ? "RENDERING..."
                                  : "DOWNLOAD CARD (PNG)"}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareToX(category.category_title, nominee, rank)}
                              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
                              title="Share to X"
                            >
                              <Share2 className="w-3.5 h-3.5 text-amber-300" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
