import React from "react";

export function TrophyGraphic({ className = "w-48 h-56" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background Arena Laser Flare */}
      <div className="absolute inset-0 bg-crimson-600/35 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute -inset-4 bg-gradient-to-t from-crimson-600/20 via-transparent to-transparent blur-xl pointer-events-none" />

      {/* MTV VMA-Inspired Noir Moonperson Trophy Illustration */}
      <svg
        viewBox="0 0 220 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 filter drop-shadow-[0_15px_30px_rgba(225,29,72,0.5)] transition-transform duration-500 hover:scale-105"
      >
        <defs>
          {/* High-Gloss Chrome 3D Metallic Gradient */}
          <linearGradient id="vmaChrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="88%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Liquid Mercury Chrome Highlight */}
          <linearGradient id="mercuryHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* VMA Golden-Crimson Astronaut Mirrored Visor */}
          <linearGradient id="vmaVisor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0055" />
            <stop offset="35%" stopColor="#e11d48" />
            <stop offset="70%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>

          {/* Neon Crimson Glow */}
          <linearGradient id="vmaLaser" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          {/* Heavy Noir Base */}
          <linearGradient id="vmaPedestal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="40%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* =========================================================================
            BACKGROUND STADIUM RAYS & ORBITS
            ========================================================================= */}
        <ellipse
          cx="110"
          cy="95"
          rx="82"
          ry="30"
          stroke="url(#vmaLaser)"
          strokeWidth="2.5"
          strokeDasharray="8 5"
          className="opacity-70"
          filter="url(#laserGlow)"
        />

        {/* Flag Pole / Antenna held by VMA Moonperson */}
        <line x1="152" y1="35" x2="152" y2="195" stroke="url(#vmaChrome)" strokeWidth="3" strokeLinecap="round" />
        
        {/* Flag / Pennant: "NOIR '26" */}
        <polygon points="152,38 205,52 152,66" fill="url(#vmaLaser)" stroke="#ffffff" strokeWidth="1" filter="url(#laserGlow)" />
        <text x="162" y="55" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="'Oswald', sans-serif" letterSpacing="1">
          NOIR '26
        </text>

        {/* =========================================================================
            ASTRONAUT / VMA MOONPERSON STATUETTE
            ========================================================================= */}

        {/* Life Support Backpack */}
        <rect x="76" y="70" width="46" height="58" rx="8" fill="url(#vmaChrome)" stroke="#334155" strokeWidth="1.5" />
        <line x1="82" y1="85" x2="116" y2="85" stroke="#0f172a" strokeWidth="2" />
        <line x1="82" y1="95" x2="116" y2="95" stroke="#0f172a" strokeWidth="2" />

        {/* Astronaut Helmet (Outer Chrome Sphere) */}
        <circle cx="100" cy="56" r="28" fill="url(#vmaChrome)" stroke="#475569" strokeWidth="2" />

        {/* Mirrored Visor (Reflective Crimson/Gold) */}
        <ellipse cx="104" cy="56" rx="19" ry="15" fill="url(#vmaVisor)" stroke="#ffffff" strokeWidth="1.5" />
        {/* Visor Glare Streak */}
        <path d="M92 48 Q104 42 118 48 Q104 53 92 48 Z" fill="#ffffff" opacity="0.8" />

        {/* Helmet Audio / Comm Ear-Packs */}
        <circle cx="72" cy="56" r="5" fill="url(#vmaChrome)" stroke="#1e293b" strokeWidth="1.5" />
        <circle cx="128" cy="56" r="5" fill="url(#vmaChrome)" stroke="#1e293b" strokeWidth="1.5" />

        {/* Torso & Spacesuit */}
        <path
          d="M84 84 C84 78, 116 78, 116 84 L122 135 C122 142, 78 142, 78 135 Z"
          fill="url(#vmaChrome)"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Chest Control Console Module */}
        <rect x="88" y="90" width="24" height="20" rx="3" fill="#0f172a" stroke="url(#vmaLaser)" strokeWidth="1.5" />
        <circle cx="94" cy="98" r="2.5" fill="#e11d48" filter="url(#laserGlow)" />
        <circle cx="102" cy="98" r="2.5" fill="#38bdf8" />
        <circle cx="98" cy="104" r="1.5" fill="#ffffff" />

        {/* Left Arm (Holding Hip / Posing) */}
        <path
          d="M84 88 C70 96, 68 116, 80 128 L84 122 C76 114, 76 100, 88 94 Z"
          fill="url(#vmaChrome)"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Right Arm (Reaching up holding the flagpole) */}
        <path
          d="M116 88 C130 92, 142 85, 152 74 L156 80 C144 94, 128 100, 114 94 Z"
          fill="url(#vmaChrome)"
          stroke="#334155"
          strokeWidth="1.5"
        />
        {/* Glove grasping pole */}
        <ellipse cx="152" cy="74" rx="4.5" ry="5.5" fill="url(#vmaChrome)" stroke="#1e293b" strokeWidth="1" />

        {/* Legs & Boots (Standing on Moon/Stage Ground) */}
        {/* Left Leg */}
        <path d="M84 138 L80 185 L94 185 L98 138 Z" fill="url(#vmaChrome)" stroke="#334155" strokeWidth="1.5" />
        {/* Left Boot */}
        <path d="M74 185 L98 185 L98 196 C98 199, 72 199, 72 196 Z" fill="url(#vmaChrome)" stroke="#1e293b" strokeWidth="1.5" />

        {/* Right Leg */}
        <path d="M102 138 L106 185 L120 185 L116 138 Z" fill="url(#vmaChrome)" stroke="#334155" strokeWidth="1.5" />
        {/* Right Boot */}
        <path d="M104 185 L128 185 L128 196 C128 199, 102 199, 102 196 Z" fill="url(#vmaChrome)" stroke="#1e293b" strokeWidth="1.5" />

        {/* Specular Light Reflection Sweep Across Body */}
        <path
          d="M92 84 L96 185 L101 185 L97 84 Z"
          fill="url(#mercuryHighlight)"
          opacity="0.8"
        />

        {/* =========================================================================
            BRUTALIST VMA AWARDS PEDESTAL
            ========================================================================= */}
        {/* Laser Ring under feet */}
        <ellipse cx="100" cy="198" rx="55" ry="12" fill="url(#vmaLaser)" opacity="0.9" filter="url(#laserGlow)" />

        {/* Pedestal Top Tier */}
        <path d="M48 204 L152 204 L142 216 L58 216 Z" fill="url(#vmaChrome)" stroke="#64748b" strokeWidth="1" />

        {/* Heavy Base Block */}
        <path d="M42 216 L158 216 L154 260 L46 260 Z" fill="url(#vmaPedestal)" stroke="#334155" strokeWidth="2" />

        {/* Chrome Metallic Plaque */}
        <rect x="58" y="224" width="84" height="24" rx="2" fill="url(#vmaChrome)" stroke="#ffffff" strokeWidth="1" />
        <text
          x="100"
          y="235"
          fill="#050507"
          fontSize="8"
          fontWeight="900"
          letterSpacing="2"
          textAnchor="middle"
          fontFamily="'Oswald', sans-serif"
        >
          NOIR AWARDS
        </text>
        <text
          x="100"
          y="244"
          fill="#be123c"
          fontSize="6"
          fontWeight="900"
          letterSpacing="1"
          textAnchor="middle"
          fontFamily="'Oswald', sans-serif"
        >
          STAN TWITTER '26
        </text>

        {/* Base Bottom Hazard Accent Line */}
        <rect x="44" y="258" width="112" height="4" fill="url(#vmaLaser)" />
      </svg>
    </div>
  );
}
