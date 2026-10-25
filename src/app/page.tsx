import React from "react";
import Link from "next/link";
import {
  Vote,
  Trophy,
  Flame,
  Award,
  Sparkles,
  Users,
  Bell,
  TrendingUp,
  BarChart3,
  Palette,
  Film,
  Laugh,
  Crown,
  ArrowRight,
  Tv,
} from "lucide-react";
import { TrophyGraphic } from "@/components/TrophyGraphic";
import { HomeNominationForm } from "@/components/HomeNominationForm";
import WinnersPage from "./winners/page";
import { getEventSettings, getCategories, getNominees } from "@/lib/supabase/db";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Bell,
  TrendingUp,
  BarChart3,
  Palette,
  Film,
  Laugh,
  Sparkles,
  Crown,
  Flame,
  Trophy,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [settings, categories] = await Promise.all([
    getEventSettings(),
    getCategories(false),
  ]);

  // When admin publishes winners, make the Winners Podium the front page!
  if (settings.winners_published) {
    return <WinnersPage />;
  }

  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      {/* =========================================================================
          HERO SECTION (CLEAN VMA STYLE — NO CLUTTER BADGES OR COUNTDOWN)
          ========================================================================= */}
      <section className="relative pt-6 pb-8 text-center space-y-6">

        {/* Trophy Illustration */}
        <div className="py-2 relative">
          <TrophyGraphic className="w-64 h-72 sm:w-80 sm:h-96 mx-auto" />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {settings.nominations_open ? (
            <a
              href="#nominate-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-heading font-black text-xs uppercase tracking-widest shadow-vma-mint transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>SUBMIT A NOMINATION</span>
            </a>
          ) : (
            <Link
              href="/nominees"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-vma-cardDark hover:bg-vma-cardHover border border-white/20 text-white font-heading font-black text-xs uppercase tracking-widest transition-all"
            >
              <Sparkles className="w-4 h-4 text-vma-mint" />
              <span>VIEW NOMINEES</span>
            </Link>
          )}

          <Link
            href="/vote"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-heading font-black text-xs uppercase tracking-widest transition-all ${
              settings.nominations_open
                ? "bg-vma-cardDark hover:bg-vma-cardHover border border-white/20 text-white"
                : "bg-vma-mint hover:bg-vma-mintHover text-noir-950 shadow-vma-mint"
            }`}
          >
            <Vote className={`w-4 h-4 ${settings.nominations_open ? "text-vma-mint" : "text-noir-950"}`} />
            <span>ENTER VOTING BOOTH</span>
          </Link>
        </div>

        {/* Rules & FAQ Link */}
        <div className="pt-1">
          <Link
            href="/rules"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-chrome-400 hover:text-vma-mint uppercase tracking-wider transition-colors"
          >
            <span>OFFICIAL RULES & CONDUCT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* =========================================================================
          EMBEDDED NOMINATION SUBMISSION ON FRONT PAGE
          ========================================================================= */}
      <section className="pt-4">
        <HomeNominationForm categories={categories} nominationsOpen={settings.nominations_open} />
      </section>

      {/* =========================================================================
          AWARD CATEGORIES LIST
          ========================================================================= */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-vma-mint flex items-center gap-2">
              <Tv className="w-4 h-4" />
              <span>2026 CATEGORIES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black uppercase text-white tracking-tight mt-1">
              AWARD CATEGORIES
            </h2>
          </div>
          <Link
            href="/vote"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-vma-mint hover:text-white transition-colors"
          >
            <span>VIEW LIVE BALLOTS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = ICON_MAP[cat.icon] || Trophy;
            return (
              <div
                key={cat.id}
                className="p-6 rounded-2xl bg-vma-cardDark border border-vma-border hover:border-vma-mint transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-noir-900 border border-white/10 flex items-center justify-center text-vma-mint group-hover:bg-vma-mint group-hover:text-noir-950 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-chrome-500 font-bold">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-tight group-hover:text-vma-mint transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-chrome-400 font-mono leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs">
                  <span className="text-chrome-500 font-semibold">10 VOTE UNITS</span>
                  <Link
                    href={`/vote?category=${cat.id}`}
                    className="text-vma-mint hover:text-white font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>VOTE</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
