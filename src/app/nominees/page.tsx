"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  ExternalLink,
  Share2,
  AlertCircle,
  Vote,
  X,
  Award,
} from "lucide-react";
import { Category, Nominee, EventSettings } from "@/types";
import { playClickSound } from "@/lib/sound";

export default function NomineesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nomineesByCategory, setNomineesByCategory] = useState<Record<string, Nominee[]>>({});
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsRes, catsRes, nomsRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/nominees?finalistsOnly=true", { cache: "no-store" }),
        ]);

        const sData = await settingsRes.json();
        const cData = await catsRes.json();
        const nData = await nomsRes.json();

        if (sData?.settings) {
          setSettings(sData.settings);
        }

        if (cData?.categories && cData.categories.length > 0) {
          setCategories(cData.categories);
          setActiveCategoryId(cData.categories[0].id);
        }

        if (nData?.nominees) {
          const grouped: Record<string, Nominee[]> = {};
          for (const nom of nData.nominees) {
            if (!grouped[nom.category_id]) {
              grouped[nom.category_id] = [];
            }
            grouped[nom.category_id].push(nom);
          }
          setNomineesByCategory(grouped);
        }
      } catch (err) {
        console.error("Failed to load nominees:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];
  const allActiveNominees = (activeCategory && nomineesByCategory[activeCategory.id]) || [];

  const filteredNominees = allActiveNominees.filter((nom) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      nom.display_name.toLowerCase().includes(q) ||
      nom.x_username.toLowerCase().includes(q)
    );
  });

  const handleShareCategory = (cat: Category) => {
    playClickSound();
    const text = `Check out the official nominees for ${cat.title} at NOIR GALA '26!`;
    const url = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // If admin has locked the nominees roster and voting/winners are not published yet
  const isRosterUnlocked =
    settings?.nominees_visible ?? (settings?.voting_open || settings?.winners_published || false);

  if (!loading && settings && !isRosterUnlocked) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-vma-mint/10 border border-vma-mint/30 flex items-center justify-center mx-auto text-vma-mint">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-heading font-black uppercase text-white tracking-tight">
            Official Nominees Coming Soon
          </h1>
          <p className="text-sm text-chrome-400 font-mono max-w-md mx-auto">
            Submissions are currently under review by the committee. The certified nominee roster will be unlocked shortly!
          </p>
        </div>
        {settings.nominations_open && (
          <div className="pt-4">
            <Link
              href="/nominate"
              onClick={playClickSound}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-heading font-black text-xs uppercase tracking-widest shadow-vma-mint transition-all"
            >
              <span>Submit a Nomination</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-vma-mint/10 border border-vma-mint/20 text-vma-mint text-xs font-mono font-bold uppercase tracking-widest">
          <Award className="w-3.5 h-3.5" />
          <span>OFFICIAL NOMINEES ROSTER</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black uppercase tracking-tight text-white">
          THE 2026 NOMINEES
        </h1>
        <p className="text-xs sm:text-sm text-chrome-400 font-mono max-w-lg mx-auto">
          Explore all certified contenders across every official category.
        </p>

        {settings?.voting_open && (
          <div className="pt-2">
            <Link
              href="/vote"
              onClick={playClickSound}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-heading font-black text-xs uppercase tracking-wider shadow-vma-mint transition-all"
            >
              <Vote className="w-4 h-4" />
              <span>Voting Is Now Live &bull; Cast Votes</span>
            </Link>
          </div>
        )}
      </div>

      {/* Horizontal Category Nav Bar (Exact MTV VMA Layout) */}
      <div className="bg-vma-cardDark border-y border-vma-border py-3 -mx-4 px-4 sm:mx-0 sm:px-4 sm:rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory?.id;
            const count = nomineesByCategory[cat.id]?.length || 0;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  playClickSound();
                  setActiveCategoryId(cat.id);
                  setSearchQuery("");
                }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-vma-mint text-noir-950 shadow-vma-mint scale-105"
                    : "bg-noir-900 text-chrome-300 hover:text-white hover:bg-noir-850 border border-white/10"
                }`}
              >
                <span>{cat.title}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-black text-vma-mint" : "bg-white/10 text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Header Strip */}
      {activeCategory && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-6 rounded-2xl bg-vma-cardDark border border-vma-border">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-vma-mint font-bold">
              OFFICIAL CATEGORY
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black uppercase text-white tracking-tight">
              {activeCategory.title}
            </h2>
            <p className="text-xs text-chrome-400 max-w-xl">
              {activeCategory.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-chrome-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search nominee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-noir-950 border border-white/10 text-xs text-white placeholder-chrome-500 focus:outline-none focus:border-vma-mint transition-colors"
              />
            </div>

            <button
              onClick={() => handleShareCategory(activeCategory)}
              aria-label="Share category on X"
              className="p-2.5 rounded-xl bg-noir-900 hover:bg-noir-850 text-chrome-300 hover:text-vma-mint border border-white/10 transition-colors"
              title="Share category on X"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Nominees Grid */}
      {loading ? (
        <div className="p-16 text-center text-chrome-500 font-mono text-xs">
          Loading certified nominees...
        </div>
      ) : filteredNominees.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-vma-cardDark border border-dashed border-vma-border space-y-2">
          <p className="text-sm text-chrome-400 font-heading">
            No approved nominees in this category yet.
          </p>
          <p className="text-xs text-chrome-500 font-mono">
            {settings?.nominations_open
              ? "Submissions are open! Nominate your favorites now."
              : "Check back as the committee approves finalists."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNominees.map((nominee) => (
            <div
              key={nominee.id}
              className="group bg-vma-cardDark border border-vma-border hover:border-vma-mint/40 rounded-2xl overflow-hidden shadow-card-vma flex flex-col transition-all duration-300"
            >
              {/* Square Image Box (Identical to MTV VMA layout) */}
              <div className="relative aspect-square w-full overflow-hidden bg-noir-950">
                {nominee.avatar_url ? (
                  <img
                    src={nominee.avatar_url}
                    alt={nominee.display_name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-noir-900 text-chrome-600 font-mono text-xs">
                    No Photo
                  </div>
                )}

                {/* Bottom dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/20 to-transparent" />

                {/* Nominee Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-vma-mint text-[10px] font-mono font-bold uppercase tracking-wider border border-vma-mint/30">
                  OFFICIAL NOMINEE
                </div>

                {/* Text Overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-heading font-black text-2xl text-white tracking-tight leading-tight drop-shadow-md truncate">
                    {nominee.display_name}
                  </h3>
                  <p className="text-xs text-chrome-300 font-mono drop-shadow truncate mt-0.5">
                    @{nominee.x_username}
                  </p>
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="bg-vma-cardHover border-t border-vma-border px-4 py-3 flex items-center justify-between text-xs font-mono">
                <span className="text-chrome-400">
                  Category: <span className="text-white font-bold">{activeCategory?.title}</span>
                </span>
                <a
                  href={`https://twitter.com/${nominee.x_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vma-mint hover:underline inline-flex items-center gap-1 font-bold text-[11px]"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
