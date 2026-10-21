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
  AlertTriangle,
  Download,
  CheckCircle,
} from "lucide-react";
import { CategoryWinnerResult, NomineeResult } from "@/types";
import { playClickSound, playVoteSuccessSound } from "@/lib/sound";

export default function WinnersPage() {
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState(false);
  const [results, setResults] = useState<CategoryWinnerResult[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Hidden Canvas for rendering downloadable winner graphic
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function fetchWinners() {
      try {
        setLoading(true);
        const res = await fetch("/api/winners");
        const data = await res.json();

        setPublished(Boolean(data.published));
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

  const handleShareToX = (categoryTitle: string, winner: NomineeResult) => {
    playClickSound();
    const text = `🏆 OFFICIAL WINNER! Huge congratulations to @${winner.x_username} for taking home ${categoryTitle} at the Noir Gala '26! #NoirGala26 #OneTimelineEveryFandom`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  /**
   * Generates a high-res VMA Winner Award graphic on HTML5 Canvas and downloads as PNG
   */
  const handleDownloadWinnerCard = async (categoryTitle: string, winner: NomineeResult) => {
    playClickSound();
    setDownloadingId(winner.nominee_id);

    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350; // Instagram / Twitter portrait aspect ratio (4:5)
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Dark Midnight Background
      ctx.fillStyle = "#07080c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle gradient floor
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#0c101a");
      grad.addColorStop(0.5, "#07080c");
      grad.addColorStop(1, "#101826");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Top VMA Border & Header
      ctx.fillStyle = "#7bf1a8";
      ctx.fillRect(60, 60, canvas.width - 120, 8);

      ctx.fillStyle = "#7bf1a8";
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText("● OFFICIAL WINNER CEREMONY // NOIR GALA '26", 60, 110);

      // 3. Category Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 64px 'Syne', 'Oswald', sans-serif";
      ctx.fillText(categoryTitle.toUpperCase(), 60, 190);

      // 4. Winner Photo Box
      const photoBoxY = 240;
      const photoBoxH = 680;
      const photoBoxW = canvas.width - 120;

      // Draw photo placeholder or image
      if (winner.avatar_url) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = resolve; // fallback gracefully
            img.src = winner.avatar_url!;
          });
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(60, photoBoxY, photoBoxW, photoBoxH, 24);
          ctx.clip();
          ctx.drawImage(img, 60, photoBoxY, photoBoxW, photoBoxH);
          ctx.restore();
        } catch {
          ctx.fillStyle = "#161c28";
          ctx.fillRect(60, photoBoxY, photoBoxW, photoBoxH);
        }
      } else {
        ctx.fillStyle = "#161c28";
        ctx.fillRect(60, photoBoxY, photoBoxW, photoBoxH);
      }

      // Dark gradient overlay at bottom of photo
      const photoGrad = ctx.createLinearGradient(0, photoBoxY + 300, 0, photoBoxY + photoBoxH);
      photoGrad.addColorStop(0, "rgba(7, 8, 12, 0)");
      photoGrad.addColorStop(1, "rgba(7, 8, 12, 0.95)");
      ctx.fillStyle = photoGrad;
      ctx.fillRect(60, photoBoxY, photoBoxW, photoBoxH);

      // Golden VMA WINNER Stamp inside photo
      ctx.fillStyle = "#7bf1a8";
      ctx.fillRect(90, photoBoxY + photoBoxH - 120, 180, 48);
      ctx.fillStyle = "#07080c";
      ctx.font = "900 24px 'Oswald', sans-serif";
      ctx.fillText("🏆 WINNER", 115, photoBoxY + photoBoxH - 88);

      // Winner Name Overlay
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 52px 'Syne', 'Oswald', sans-serif";
      ctx.fillText(winner.display_name, 90, photoBoxY + photoBoxH - 30);

      // 5. Bottom Info Bar
      const bottomY = photoBoxY + photoBoxH + 40;
      ctx.fillStyle = "#121722";
      ctx.roundRect(60, bottomY, photoBoxW, 200, 20);
      ctx.fill();
      ctx.strokeStyle = "#1e283c";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#7bf1a8";
      ctx.font = "bold 36px 'JetBrains Mono', monospace";
      ctx.fillText(`@${winner.x_username}`, 100, bottomY + 70);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText(
        `TOTAL VOTES: ${winner.votes.toLocaleString()} (${winner.percentage}% of category votes)`,
        100,
        bottomY + 130
      );

      ctx.fillStyle = "#475569";
      ctx.font = "20px 'JetBrains Mono', monospace";
      ctx.fillText("ONE TIMELINE. EVERY FANDOM. // NOIR '26", 100, bottomY + 170);

      // Trigger file download
      playVoteSuccessSound();
      const link = document.createElement("a");
      link.download = `noir26-winner-${winner.x_username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-28 px-4 text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full border-2 border-vma-mint border-t-transparent animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-widest text-chrome-400">Opening Vault...</p>
      </div>
    );
  }

  // =========================================================================
  // STATE 1: VAULT EMBARGO (BEFORE WINNER REVEAL)
  // =========================================================================
  if (!published) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-8 font-mono">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vma-cardDark border border-vma-mint/40 text-vma-mint text-xs font-bold uppercase tracking-widest shadow-vma-mint">
          <Lock className="w-4 h-4" />
          <span>BALLOTS UNDER EMBARGO</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-heading font-black uppercase text-white tracking-tight">
            THE WINNERS ARE UNDER WRAPS.
          </h1>
          <p className="text-xs sm:text-sm text-chrome-400 max-w-xl mx-auto leading-relaxed">
            All ballots, tallies, and winner standings remain strictly confidential until the admin
            approves the final broadcast reveal.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-vma-cardDark border border-vma-border max-w-md mx-auto space-y-3 shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-vma-mint font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Ceremony Status</span>
          </div>
          <div className="font-heading text-3xl sm:text-4xl font-black text-white">
            COMING SOON
          </div>
          <p className="text-[11px] text-chrome-500">
            Standings will be unlocked globally once voting concludes and the ceremony airs!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/vote"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-vma-mint text-noir-950 font-black text-xs uppercase tracking-widest shadow-vma-mint hover:bg-vma-mintHover transition-all"
          >
            VOTE IN LIVE BALLOT
          </Link>
          <Link
            href="/nominate"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-vma-cardDark border border-white/20 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all"
          >
            SUBMIT NOMINATIONS
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: REVEALED WINNERS STAGE (WITH DOWNLOADABLE PICTURE)
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hidden canvas for downloading */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vma-mint/20 border border-vma-mint/50 text-vma-mint font-mono text-xs font-bold uppercase tracking-widest shadow-vma-mint">
          <Sparkles className="w-4 h-4" />
          <span>OFFICIAL 2026 WINNERS PODIUM</span>
        </div>
        <h1 className="text-4xl sm:text-7xl font-heading font-black uppercase text-white tracking-tight">
          THE 2026 CHAMPIONS
        </h1>
        <p className="text-xs sm:text-sm text-chrome-400 font-mono max-w-xl mx-auto">
          Verified winners across Stan Twitter. Congratulations to the icons who ruled the timeline!
        </p>
      </div>

      {/* Winners Cards Grid */}
      <div className="space-y-14">
        {results.map((category) => {
          const winners = category.winners;

          return (
            <div
              key={category.category_id}
              className="p-6 sm:p-8 rounded-3xl bg-vma-cardDark border border-vma-border shadow-2xl space-y-6"
            >
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold text-vma-mint uppercase tracking-widest">
                    AWARD ACCOLADE
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight">
                    {category.category_title}
                  </h2>
                </div>
                <div className="font-mono text-xs text-chrome-400">
                  Total Votes: <strong className="text-white">{category.total_votes.toLocaleString()}</strong>
                </div>
              </div>

              {winners.length === 0 ? (
                <p className="text-xs text-chrome-500 font-mono py-4">No votes recorded.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {winners.map((winner) => (
                    <div
                      key={winner.nominee_id}
                      className="rounded-2xl overflow-hidden bg-noir-900 border-2 border-vma-mint shadow-vma-mint-lg space-y-4 flex flex-col justify-between"
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
                          <div className="w-full h-full flex items-center justify-center bg-noir-800 font-heading font-black text-6xl text-chrome-600">
                            {winner.display_name.charAt(0)}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/30 to-transparent" />

                        {/* Winner Pill */}
                        <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-vma-mint text-noir-950 font-mono text-xs font-black uppercase tracking-wider shadow-md">
                          🏆 WINNER
                        </div>

                        {/* Name inside Photo */}
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                          <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
                            {winner.display_name}
                          </h3>
                          <a
                            href={`https://x.com/${winner.x_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-vma-mint hover:underline flex items-center gap-1"
                          >
                            <span>@{winner.x_username}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Vote Stats */}
                      <div className="px-6 py-2 flex items-center justify-between font-mono text-xs">
                        <span className="text-chrome-400">Category Vote Share:</span>
                        <span className="text-vma-mint font-bold text-sm">
                          {winner.percentage}% ({winner.votes.toLocaleString()} votes)
                        </span>
                      </div>

                      {/* Downloadable Picture Button & Share Button */}
                      <div className="p-4 bg-noir-950 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                        {/* THE REQUESTED DOWNLOAD BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDownloadWinnerCard(category.category_title, winner)}
                          disabled={downloadingId === winner.nominee_id}
                          className="w-full py-3 px-4 rounded-xl bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-vma-mint transition-all"
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
                          onClick={() => handleShareToX(category.category_title, winner)}
                          className="w-full sm:w-auto py-3 px-4 rounded-xl bg-noir-850 hover:bg-noir-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-vma-mint" />
                          <span>SHARE TO X</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
