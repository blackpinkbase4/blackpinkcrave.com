"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Flame, Shield, Award, BookOpen, Vote, Sparkles } from "lucide-react";
import { playClickSound } from "@/lib/sound";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [votingOpen, setVotingOpen] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setVotingOpen(data.settings.voting_open);
        }
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/nominate", label: "Nominate" },
    { href: "/vote", label: "Vote", highlight: true },
    { href: "/winners", label: "Winners" },
    { href: "/rules", label: "Rules" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#07080c]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Minimal Straight Brand Logo (No MTV, Straight Line) */}
        <Link
          href="/"
          onClick={playClickSound}
          className="flex items-center space-x-2 group whitespace-nowrap"
        >
          <span className="font-heading font-black text-base sm:text-xl text-white tracking-tight uppercase">
            NOIR STAN AWARDS
          </span>
          <span className="font-mono text-vma-mint font-black text-sm sm:text-lg">
            &#39;26
          </span>
        </Link>

        {/* Minimal Desktop Links (Matches Screenshot 1 Style) */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            if (link.highlight) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={playClickSound}
                  className="px-4 py-1.5 rounded-full bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-bold text-xs uppercase tracking-wider transition-all shadow-vma-mint"
                >
                  {link.label}
                </Link>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={playClickSound}
                className={`transition-colors text-xs font-semibold uppercase tracking-wider ${
                  isActive ? "text-vma-mint" : "text-chrome-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {votingOpen !== null && (
            <span
              className={`w-2 h-2 rounded-full ${
                votingOpen ? "bg-vma-mint animate-pulse" : "bg-chrome-600"
              }`}
              title={votingOpen ? "Voting Open" : "Voting Paused"}
            />
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => {
              playClickSound();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Toggle navigation"
            className="p-2 text-chrome-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#07080c] px-4 py-4 space-y-3 font-mono">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  playClickSound();
                  setMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                  isActive
                    ? "bg-vma-mint/10 text-vma-mint border border-vma-mint/30"
                    : "text-chrome-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
