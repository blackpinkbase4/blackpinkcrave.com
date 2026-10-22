"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Radio } from "lucide-react";
import { isSoundEnabled, toggleSound, playClickSound } from "@/lib/sound";

export function BroadcastTicker() {
  const [sfxOn, setSfxOn] = useState(true);
  const [isPowerHour, setIsPowerHour] = useState(false);

  useEffect(() => {
    setSfxOn(isSoundEnabled());
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.power_hour_active) {
          setIsPowerHour(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleSfx = () => {
    const nextState = toggleSound();
    setSfxOn(nextState);
    if (nextState) playClickSound();
  };

  const tickerText = [
    isPowerHour ? "⚡ VMA POWER HOUR ACTIVE: 30 VOTES PER CATEGORY (TRIPLE VOTES)!" : "🔴 LIVE CEREMONY FEED",
    "NOIR GALA '26",
    "ONE TIMELINE. EVERY FANDOM.",
    isPowerHour ? "⚡ 30 VOTES PER CATEGORY LIVE NOW" : "10 VOTES PER CATEGORY",
    "SPLIT OR STACK YOUR VOTES",
    "ZERO EMAIL / OAUTH REQUIRED",
    "HONORING EDITORS, CHARTS, FANBASES & MEME LORDS ACROSS ALL STANTWT",
    "GRAND WINNER REVEAL: COMING SOON",
  ];

  return (
    <div className="w-full bg-noir-950 border-b border-crimson-600/40 text-[11px] font-mono tracking-widest uppercase overflow-hidden flex items-center relative z-50 h-8 shadow-crimson-glow">
      {/* Live Badge On-Air Indicator */}
      <div className="bg-crimson-600 text-white font-black px-3 h-full flex items-center gap-1.5 shrink-0 z-20 shadow-md">
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        <span className="font-extrabold tracking-tighter">ON AIR</span>
      </div>

      {/* Marquee Ticker Track */}
      <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center">
        <div className="animate-ticker text-chrome-300 font-bold flex items-center gap-8 pl-4">
          {tickerText.concat(tickerText).map((item, idx) => (
            <span key={idx} className="flex items-center gap-4">
              <span className={item.includes("🔴") ? "text-crimson-400" : "text-chrome-200"}>
                {item}
              </span>
              <span className="text-crimson-500 font-extrabold font-mono opacity-80">//</span>
            </span>
          ))}
        </div>
      </div>

      {/* Audio SFX Toggle Button */}
      <button
        onClick={handleToggleSfx}
        className="px-3 h-full bg-noir-900 border-l border-white/10 text-chrome-400 hover:text-white flex items-center gap-1.5 shrink-0 transition-colors"
        title="Toggle Broadcast Sound Effects"
      >
        {sfxOn ? <Volume2 className="w-3.5 h-3.5 text-crimson-400" /> : <VolumeX className="w-3.5 h-3.5 text-chrome-600" />}
        <span className="text-[10px] hidden sm:inline">{sfxOn ? "SFX ON" : "SFX MUTE"}</span>
      </button>
    </div>
  );
}
