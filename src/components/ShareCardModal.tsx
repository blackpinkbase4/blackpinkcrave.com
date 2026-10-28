"use client";

import React, { useRef, useState } from "react";
import { Download, Share2, Sparkles, Check } from "lucide-react";
import { playClickSound, playVoteSuccessSound } from "@/lib/sound";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  nomineeName: string;
  nomineeHandle: string;
  categoryTitle: string;
  avatarUrl?: string | null;
  votesAllocated?: number;
}

export function ShareCardModal({
  isOpen,
  onClose,
  nomineeName,
  nomineeHandle,
  categoryTitle,
  avatarUrl,
  votesAllocated,
}: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateCard = async (): Promise<string> => {
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 675; // 16:9 Landscape format
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // 1. Sleek Noir Cinematic Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
    bgGrad.addColorStop(0, "#050505");
    bgGrad.addColorStop(0.5, "#0b0c10");
    bgGrad.addColorStop(1, "#020202");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 675);

    // Subtle Gold / Mint Ambient Glow
    const glowGrad = ctx.createRadialGradient(950, 337, 50, 950, 337, 450);
    glowGrad.addColorStop(0, "rgba(234, 179, 8, 0.15)");
    glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1200, 675);

    // Luxury Border Frame
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 1140, 615);

    // Gold Corner Accents
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 4;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(30, 60); ctx.lineTo(30, 30); ctx.lineTo(60, 30); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(1140, 60); ctx.lineTo(1170, 30); ctx.lineTo(1140, 30); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(30, 615); ctx.lineTo(30, 645); ctx.lineTo(60, 645); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(1140, 645); ctx.lineTo(1170, 645); ctx.lineTo(1170, 615); ctx.stroke();

    // 2. Event Brand Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 42px 'Oswald', sans-serif";
    ctx.fillText("NOIR GALA '26", 70, 95);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "700 16px 'JetBrains Mono', monospace";
    ctx.fillText("HOSTED BY @PINKNOIR_4", 70, 125);

    // Category Pill
    ctx.fillStyle = "rgba(0, 245, 160, 0.15)";
    ctx.fillRect(70, 160, 500, 36);
    ctx.strokeStyle = "rgba(0, 245, 160, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(70, 160, 500, 36);

    ctx.fillStyle = "#00f5a0";
    ctx.font = "800 16px 'JetBrains Mono', monospace";
    ctx.fillText(`CATEGORY: ${categoryTitle.toUpperCase()}`, 85, 184);

    // 3. Nominee Display Name & Handle
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 64px 'Oswald', sans-serif";
    ctx.fillText(nomineeName.slice(0, 24), 70, 290);

    ctx.fillStyle = "#00f5a0";
    ctx.font = "700 28px 'JetBrains Mono', monospace";
    ctx.fillText(`@${nomineeHandle}`, 70, 335);

    // Optional Votes Stamped
    if (votesAllocated && votesAllocated > 0) {
      ctx.fillStyle = "#eab308";
      ctx.font = "800 24px 'Oswald', sans-serif";
      ctx.fillText(`⚡ ${votesAllocated} VOTES CAST`, 70, 385);
    }

    // Official Certified Badge
    ctx.fillStyle = "#9ca3af";
    ctx.font = "600 18px 'JetBrains Mono', monospace";
    ctx.fillText("OFFICIAL NOMINEE BALLOT", 70, 580);

    // 4. Draw Avatar / Artwork (Right side)
    const avatarSize = 340;
    const avatarX = 760;
    const avatarY = 160;

    // Outer Glow Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    if (avatarUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = avatarUrl;
        });

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } catch {
        ctx.fillStyle = "#1f2937";
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return canvas.toDataURL("image/png");
  };

  const handleDownload = async () => {
    setDownloading(true);
    playClickSound();
    try {
      const dataUrl = await generateCard();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `noir-gala-26-${nomineeHandle}.png`;
      a.click();
      playVoteSuccessSound();
    } catch {
      alert("Failed to generate share card.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareX = () => {
    playClickSound();
    const text = `I'm supporting @${nomineeHandle} for ${categoryTitle} at NOIR GALA '26! Hosted by @pinknoir_4 🏆`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://blackpinkcrave.com")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-vma-cardDark border border-vma-border rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-center">
        <canvas ref={canvasRef} className="hidden" />

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vma-mint/10 border border-vma-mint/30 text-vma-mint text-[11px] font-mono font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OFFICIAL SHARE ASSET (16:9)</span>
          </div>
          <h3 className="text-xl font-heading font-black text-white uppercase">
            {nomineeName}
          </h3>
          <p className="text-xs text-chrome-400 font-mono">
            Category: {categoryTitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="py-3 px-4 rounded-xl bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-vma-mint"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "GENERATING..." : "DOWNLOAD CARD"}</span>
          </button>

          <button
            onClick={handleShareX}
            className="py-3 px-4 rounded-xl bg-noir-900 hover:bg-noir-800 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4 text-vma-mint" />
            <span>SHARE TO X</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-chrome-500 hover:text-white uppercase tracking-wider font-mono cursor-pointer transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
