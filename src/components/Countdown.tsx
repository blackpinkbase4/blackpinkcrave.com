"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  targetDate: string; // ISO string
  timezone?: string;
}

export function Countdown({ targetDate, timezone = "America/New_York" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    function calculate() {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (isNaN(target) || difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    }

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-crimson-950/60 border border-crimson-600/40 text-crimson-400 font-mono text-sm font-bold uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
        <span>VOTING PERIOD HAS CONCLUDED</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 sm:gap-3 text-white">
        {/* Days */}
        <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-noir-900 border border-white/10 min-w-[60px] sm:min-w-[76px] shadow-card-noir">
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-chrome">
            {String(timeLeft.days).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-chrome-400 font-semibold mt-1">
            Days
          </span>
        </div>

        <span className="font-mono text-2xl text-crimson-500 font-bold">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-noir-900 border border-white/10 min-w-[60px] sm:min-w-[76px] shadow-card-noir">
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-chrome">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-chrome-400 font-semibold mt-1">
            Hours
          </span>
        </div>

        <span className="font-mono text-2xl text-crimson-500 font-bold">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-noir-900 border border-white/10 min-w-[60px] sm:min-w-[76px] shadow-card-noir">
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-chrome">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-chrome-400 font-semibold mt-1">
            Mins
          </span>
        </div>

        <span className="font-mono text-2xl text-crimson-500 font-bold">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-noir-900 border border-crimson-500/40 min-w-[60px] sm:min-w-[76px] shadow-crimson-glow">
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-crimson-400">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-crimson-400/80 font-semibold mt-1">
            Secs
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-chrome-400 font-mono">
        <Clock className="w-3.5 h-3.5 text-crimson-500" />
        <span>Timezone: {timezone}</span>
      </div>
    </div>
  );
}
