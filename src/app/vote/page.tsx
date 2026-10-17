"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Vote,
  Sparkles,
  ExternalLink,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Category, Nominee } from "@/types";
import { playClickSound, playVoteSuccessSound } from "@/lib/sound";

function VmaVotingContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryNominees, setCategoryNominees] = useState<Record<string, Nominee[]>>({});
  const [loading, setLoading] = useState(true);
  const [eventOpen, setEventOpen] = useState(true);

  // Persistent anonymous voter session token
  const [voterToken, setVoterToken] = useState("");

  useEffect(() => {
    let token = "";
    try {
      token = localStorage.getItem("noir_voter_token") || "";
      if (!token) {
        token = `voter_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem("noir_voter_token", token);
      }
    } catch {
      token = `voter_${Math.random().toString(36).substring(2, 10)}`;
    }
    setVoterToken(token);
  }, []);

  // Balances per category
  const [balances, setBalances] = useState<Record<string, number>>({});
  // Current pending allocations: { [categoryId]: { [nomineeId]: votes } }
  const [pendingAllocations, setPendingAllocations] = useState<Record<string, Record<string, number>>>({});

  // Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load initial settings and categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsRes, catsRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        const sData = await settingsRes.json();
        const cData = await catsRes.json();

        if (sData?.settings) {
          setEventOpen(Boolean(sData.settings.voting_open));
        }

        if (cData?.categories && cData.categories.length > 0) {
          setCategories(cData.categories);
          // Expand initial category
          const defaultCat =
            cData.categories.find((c: Category) => c.id === initialCategoryParam) ||
            cData.categories[0];
          setExpandedCategoryId(defaultCat.id);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialCategoryParam]);

  // Load finalists for expanded category
  useEffect(() => {
    if (!expandedCategoryId) return;
    if (categoryNominees[expandedCategoryId]) return; // Already cached

    async function loadNominees() {
      try {
        const res = await fetch(
          `/api/nominees?categoryId=${expandedCategoryId}&finalistsOnly=true`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data?.nominees) {
          setCategoryNominees((prev) => ({ ...prev, [expandedCategoryId as string]: data.nominees }));
        }
      } catch {}
    }

    loadNominees();
  }, [expandedCategoryId, categoryNominees]);

  // Fetch remaining balance for a category
  const fetchBalance = useCallback(async (token: string, catId: string) => {
    if (!catId) return;
    try {
      const res = await fetch(
        `/api/voter-balance?username=${encodeURIComponent(token || "")}&categoryId=${encodeURIComponent(catId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data && typeof data.votes_remaining === "number") {
        setBalances((prev) => ({ ...prev, [catId]: data.votes_remaining }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (expandedCategoryId) {
      fetchBalance(voterToken, expandedCategoryId);
    }
  }, [voterToken, expandedCategoryId, fetchBalance]);

  // Toggle category accordion
  const handleToggleCategory = (catId: string) => {
    playClickSound();
    setExpandedCategoryId((prev) => (prev === catId ? null : catId));
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  // Current category credits
  const currentRemaining = balances[expandedCategoryId || ""] ?? 10;
  const currentPending = pendingAllocations[expandedCategoryId || ""] || {};
  const currentPendingTotal = Object.values(currentPending).reduce((sum, v) => sum + (v || 0), 0);
  const remainingAfterPending = currentRemaining - currentPendingTotal;

  // Change vote (+ or -)
  const handleVoteChange = (nomineeId: string, delta: number) => {
    if (!expandedCategoryId) return;

    const currentVal = currentPending[nomineeId] || 0;
    const nextVal = currentVal + delta;
    if (nextVal < 0) return;

    if (delta > 0 && remainingAfterPending <= 0) {
      setSubmitError(`No remaining vote credits left in this category (10/10 limit reached).`);
      return;
    }

    playClickSound();
    setSubmitError(null);

    setPendingAllocations((prev) => {
      const catAlloc = { ...(prev[expandedCategoryId] || {}) };
      if (nextVal === 0) {
        delete catAlloc[nomineeId];
      } else {
        catAlloc[nomineeId] = nextVal;
      }
      return { ...prev, [expandedCategoryId]: catAlloc };
    });
  };

  // Submit votes for the currently expanded category
  const handleSubmitCategoryVotes = async () => {
    if (!expandedCategoryId) return;
    if (currentPendingTotal <= 0) {
      setSubmitError("Please allocate at least 1 vote credit before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const allocationsArray = Object.entries(currentPending).map(([nominee_id, votes]) => ({
      nominee_id,
      votes,
    }));

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voter_username: voterToken,
          category_id: expandedCategoryId,
          allocations: allocationsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Failed to submit votes.");
        if (typeof data.remaining_votes === "number") {
          setBalances((prev) => ({ ...prev, [expandedCategoryId]: data.remaining_votes }));
        }
      } else {
        playVoteSuccessSound();
        setSubmitSuccess(`Success! Cast ${data.votes_cast} vote credit(s) for this category.`);
        // Clear pending allocations for this category
        setPendingAllocations((prev) => ({ ...prev, [expandedCategoryId]: {} }));
        if (typeof data.remaining_votes === "number") {
          setBalances((prev) => ({ ...prev, [expandedCategoryId]: data.remaining_votes }));
        }

        // Confetti explosion
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ["#7bf1a8", "#5eead4", "#ffffff", "#10b981"],
          });
        } catch {}
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nominees = expandedCategoryId ? categoryNominees[expandedCategoryId] || [] : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Official Voting Booth Header */}
      <section className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vma-mint/10 border border-vma-mint/30 text-vma-mint font-mono text-xs font-bold uppercase tracking-wider">
          <Vote className="w-3.5 h-3.5" />
          <span>OFFICIAL VOTING BOOTH</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black uppercase text-white tracking-tight">
          CAST YOUR VOTES
        </h1>
        <p className="text-xs sm:text-sm text-chrome-400 font-mono max-w-xl mx-auto">
          Every fan gets 10 votes per category. Split or stack your credits across your favorite finalists below!
        </p>
      </section>

      {/* Voting Closed Notice */}
      {!eventOpen && (
        <div className="p-4 rounded-xl bg-crimson-950/80 border border-crimson-600/50 text-center space-y-1 font-mono">
          <div className="text-sm font-bold text-crimson-300 uppercase tracking-wider flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-crimson-400" />
            <span>VOTING PERIOD HAS NOT OPENED OR HAS CONCLUDED</span>
          </div>
          <p className="text-xs text-chrome-400">
            The admin has paused or closed voting. Stay tuned for the winners reveal!
          </p>
        </div>
      )}

      {/* =========================================================================
          MTV VMA CATEGORY ACCORDION LIST (MATCHES SCREENSHOT 1)
          ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-vma-mint">
            OFFICIAL NOIR STAN AWARDS BALLOT
          </span>
          <h1 className="text-3xl sm:text-5xl font-heading font-black uppercase text-white tracking-tight">
            VOTE BY CATEGORY
          </h1>
        </div>

        {/* Global Feedback Toasts */}
        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {submitError && (
          <div className="p-4 rounded-xl bg-crimson-950/90 border border-crimson-500/50 text-crimson-200 text-xs font-mono flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Accordion Categories List */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = expandedCategoryId === cat.id;
            const remaining = balances[cat.id] ?? 10;

            return (
              <div
                key={cat.id}
                className={`rounded-2xl transition-all border ${
                  isExpanded
                    ? "bg-vma-cardDark border-vma-mint shadow-2xl"
                    : "bg-vma-cardDark/60 border-white/10 hover:border-white/20"
                }`}
              >
                {/* Accordion Header (Matches Screenshot 1) */}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(cat.id)}
                  className="w-full py-8 px-6 sm:px-8 text-center flex flex-col items-center justify-center space-y-1.5 group select-none"
                >
                  <div className="flex items-center justify-center gap-3">
                    <h2 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight group-hover:text-vma-mint transition-colors">
                      {cat.title}
                    </h2>
                    {isExpanded ? (
                      <ChevronUp className="w-7 h-7 sm:w-8 sm:h-8 text-chrome-400 group-hover:text-vma-mint" />
                    ) : (
                      <ChevronDown className="w-7 h-7 sm:w-8 sm:h-8 text-chrome-400 group-hover:text-vma-mint" />
                    )}
                  </div>

                  {/* Subtitle: "10/10 votes remaining" (Matches Screenshot 1) */}
                  <div className="font-mono text-xs sm:text-sm text-chrome-400 font-semibold tracking-wider">
                    <span>
                      <strong className="text-vma-mint">{remaining}</strong>/10 votes remaining
                    </span>
                  </div>
                </button>

                {/* Expanded Content: Nominee Cards Grid (Matches Screenshot 2) */}
                {isExpanded && (
                  <div className="p-6 sm:p-8 border-t border-white/10 space-y-8">
                    {nominees.length === 0 ? (
                      <div className="py-12 text-center space-y-3 font-mono">
                        <p className="text-xs text-chrome-400">
                          No approved finalists for this category yet.
                        </p>
                        <p className="text-[11px] text-chrome-500">
                          Submit nominations at{" "}
                          <Link href="/nominate" className="text-vma-mint underline">
                            /nominate
                          </Link>
                          , or the admin can roll the Top 8 in the admin panel!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {nominees.map((nominee) => {
                          const currentVal = currentPending[nominee.id] || 0;

                          return (
                            <div
                              key={nominee.id}
                              className="rounded-2xl overflow-hidden bg-vma-cardDark border border-white/10 hover:border-vma-mint transition-all flex flex-col justify-between shadow-card-vma group"
                            >
                              {/* Photographic Card Top (Matches Screenshot 2) */}
                              <div className="relative aspect-[4/4.5] w-full bg-noir-900 overflow-hidden">
                                {nominee.avatar_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={nominee.avatar_url}
                                    alt={nominee.display_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-noir-850 to-noir-950 font-heading font-black text-5xl text-chrome-700">
                                    {nominee.display_name.charAt(0)}
                                  </div>
                                )}

                                {/* Bottom dark gradient over photo */}
                                <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/40 to-transparent pointer-events-none" />

                                {/* Name & Handle Overlay at bottom-left */}
                                <div className="absolute bottom-4 left-4 right-4 z-10 space-y-0.5">
                                  <h3 className="font-heading font-black text-xl sm:text-2xl text-white leading-tight drop-shadow-md">
                                    {nominee.display_name}
                                  </h3>
                                  <a
                                    href={`https://x.com/${nominee.x_username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-xs text-chrome-300 hover:text-vma-mint flex items-center gap-1 drop-shadow"
                                  >
                                    <span>@{nominee.x_username}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>

                              {/* VMA Bottom Stepper Bar (Matches Screenshot 2) */}
                              <div className="py-4 px-6 bg-noir-900/95 border-t border-white/10 flex items-center justify-between select-none">
                                {/* Minus Button (Dark Circle) */}
                                <button
                                  type="button"
                                  aria-label="Subtract vote"
                                  disabled={currentVal <= 0}
                                  onClick={() => handleVoteChange(nominee.id, -1)}
                                  className="w-12 h-12 rounded-full bg-noir-800 hover:bg-noir-700 border border-white/15 text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-noir-800 transition-colors shadow-md active:scale-95"
                                >
                                  <Minus className="w-5 h-5" />
                                </button>

                                {/* Center Vote Display: "0" with "Votes" below */}
                                <div className="text-center font-mono">
                                  <div className="text-2xl font-black text-white leading-none">
                                    {currentVal}
                                  </div>
                                  <div className="text-[10px] text-chrome-400 font-bold uppercase tracking-widest mt-0.5">
                                    Votes
                                  </div>
                                </div>

                                {/* Plus Button (Iconic VMA Mint Green Circle) */}
                                <button
                                  type="button"
                                  aria-label="Add vote"
                                  disabled={remainingAfterPending <= 0}
                                  onClick={() => handleVoteChange(nominee.id, 1)}
                                  className="w-12 h-12 rounded-full bg-vma-mint hover:bg-vma-mintHover text-noir-950 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-vma-mint transition-transform shadow-vma-mint active:scale-95 font-bold"
                                >
                                  <Plus className="w-6 h-6 stroke-[3]" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Category Action Submit Bar */}
                    {nominees.length > 0 && (
                      <div className="p-4 rounded-2xl bg-noir-900 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
                        <div className="text-left text-xs text-chrome-300">
                          Pending submission:{" "}
                          <strong className="text-white font-bold">{currentPendingTotal}</strong>{" "}
                          vote(s). Remaining after submit:{" "}
                          <strong className="text-vma-mint font-bold">{remainingAfterPending}</strong>/10
                        </div>

                        <button
                          type="button"
                          disabled={!eventOpen || currentPendingTotal <= 0 || isSubmitting}
                          onClick={handleSubmitCategoryVotes}
                          className="w-full sm:w-auto px-8 py-3 rounded-full bg-vma-mint hover:bg-vma-mintHover disabled:opacity-30 text-noir-950 font-heading font-black text-xs uppercase tracking-widest shadow-vma-mint transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>SUBMITTING BALLOT...</span>
                            </>
                          ) : (
                            <>
                              <Vote className="w-4 h-4" />
                              <span>LOCK IN {currentPendingTotal || ""} VOTES</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4 font-mono">
          <div className="w-12 h-12 rounded-full border-2 border-vma-mint border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-chrome-400">Loading MTV VMA Ballot...</p>
        </div>
      }
    >
      <VmaVotingContent />
    </Suspense>
  );
}
