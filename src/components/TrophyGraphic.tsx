import React from "react";

export function TrophyGraphic({ className = "w-60 h-68 sm:w-72 sm:h-84" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center mx-auto ${className}`}>
      {/* Ambient Crimson Arena Glow */}
      <div className="absolute inset-0 bg-crimson-600/30 rounded-3xl blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute -inset-3 bg-gradient-to-t from-crimson-600/25 via-transparent to-transparent blur-xl pointer-events-none" />

      {/* Official NOIR GALA '26 3D Trophy Showcase */}
      <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-crimson-500/35 shadow-[0_15px_40px_rgba(225,29,72,0.45)] transition-transform duration-500 hover:scale-[1.02] group bg-noir-950">
        <img
          src="/noir-gala-trophy.jpg"
          alt="NOIR GALA '26 Official Star Trophy"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        {/* Subtle Vignette & Shadow Bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040406]/90 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
