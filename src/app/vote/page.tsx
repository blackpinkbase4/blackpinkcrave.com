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
  Share2,
  Copy,
  Check,
  ArrowRight,
  Zap,
  Hourglass,
} from "lucide-react";
import { Category, Nominee, EventSettings } from "@/types";
import { playClickSound, playVoteSuccessSound } from "@/lib/sound";

function fallbackCopyText(text: string) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  } catch {}
}

function VmaVotingContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");
  const initialNomineeParam = searchParams.get("nominee");

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryNominees, setCategoryNominees] = useState<Record<string, Nominee[]>>({});
  const [loading, setLoading] = useState(true);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);

  // VMA Device Cooldowns & Power Hour
  const [categoryCooldowns, setCategoryCooldowns] = useState<Record<string, number>>({});
  const [now, setNow] = useState<number>(Date.now());

  // 1-second interval to tick down all active cooldown timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
    }
    return `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Voter Username & Confirmation State
  const [inputHandle, setInputHandle] = useState("");
  const [voterUsername, setVoterUsername] = useState("");
  const [voterToken, setVoterToken] = useState("");
  const [isHandleSubmitted, setIsHandleSubmitted] = useState(false);

  // Share & Deep-link State
  const [highlightedNomineeId, setHighlightedNomineeId] = useState<string | null>(initialNomineeParam);
  const [copiedNomineeId, setCopiedNomineeId] = useState<string | null>(null);

  useEffect(() => {
    let token = "";
    try {
      token = localStorage.getItem("noir_voter_token") || "";
      if (!token) {
        token = `voter_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem("noir_voter_token", token);
      }
      const savedUser = localStorage.getItem("noir_voter_username") || "";
      if (savedUser) {
        setVoterUsername(savedUser);
        setInputHandle(savedUser);
        setIsHandleSubmitted(true);
      }
      const savedCooldowns = localStorage.getItem("noir_category_cooldowns");
      if (savedCooldowns) {
        setCategoryCooldowns(JSON.parse(savedCooldowns));
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

  // Load initial settings and categories (lightweight, instant)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsRes, catsRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        const [sData, cData] = await Promise.all([
          settingsRes.json(),
          catsRes.json(),
        ]);

        if (sData?.settings) {
          setEventSettings(sData.settings);
          setEventOpen(Boolean(sData.settings.voting_open));

          // Priority #3: Game theory clean slate - if Power Hour is active, waive all local cooldowns!
          if (sData.settings.power_hour_active) {
            setCategoryCooldowns({});
            try {
              localStorage.removeItem("noir_category_cooldowns");
            } catch {}
          } else if (typeof sData.settings.cooldown_hours === "number") {
            // Recalibrate existing active cooldowns if admin changed cooldown window
            const maxMs = sData.settings.cooldown_hours * 3600 * 1000;
            setCategoryCooldowns((prev) => {
              const adjusted: Record<string, number> = {};
              let changed = false;
              for (const [cat, unlockTime] of Object.entries(prev)) {
                const remaining = unlockTime - Date.now();
                if (remaining > maxMs) {
                  adjusted[cat] = Date.now() + maxMs;
                  changed = true;
                } else {
                  adjusted[cat] = unlockTime;
                }
              }
              if (changed) {
                try {
                  localStorage.setItem("noir_category_cooldowns", JSON.stringify(adjusted));
                } catch {}
              }
              return adjusted;
            });
          }
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

  // On-demand fetch of nominees for only the expanded category (instant ~50ms)
  useEffect(() => {
    if (!expandedCategoryId) return;
    const catId: string = expandedCategoryId;
    if (categoryNominees[catId]) return; // Cached locally

    async function loadExpandedNominees() {
      try {
        const res = await fetch(`/api/nominees?categoryId=${encodeURIComponent(catId)}&finalistsOnly=true`, { cache: "no-store" });
        const data = await res.json();
        if (data?.nominees) {
          setCategoryNominees((prev) => {
            const next = { ...prev };
            next[catId] = data.nominees;
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to fetch nominees for expanded category:", err);
      }
    }

    loadExpandedNominees();
  }, [expandedCategoryId, categoryNominees]);

  // Fetch remaining balance for a category
  const fetchBalance = useCallback(async (tokenOrUser: string, catId: string) => {
    if (!catId) return;
    try {
      const res = await fetch(
        `/api/voter-balance?username=${encodeURIComponent(tokenOrUser || "")}&categoryId=${encodeURIComponent(catId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data && typeof data.votes_remaining === "number") {
        setBalances((prev) => ({ ...prev, [catId]: data.votes_remaining }));
      }
    } catch {}
  }, []);

  const effectiveVoter = voterUsername.trim() || voterToken;

  useEffect(() => {
    if (expandedCategoryId && effectiveVoter) {
      fetchBalance(effectiveVoter, expandedCategoryId);
    }
  }, [effectiveVoter, expandedCategoryId, fetchBalance]);


  // Deep-link scroll to nominee
  useEffect(() => {
    if (initialNomineeParam && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`nominee-${initialNomineeParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedNomineeId(initialNomineeParam);
        }
      }, 400);
    }
  }, [initialNomineeParam, loading]);

  // Confirm / Submit voter handle
  const handleConfirmVoterHandle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = inputHandle.replace(/^@+/, "").trim();
    if (!cleaned) {
      setSubmitError("Please enter your Twitter / X handle before clicking submit.");
      return;
    }
    playClickSound();
    setVoterUsername(cleaned);
    try {
      localStorage.setItem("noir_voter_username", cleaned);
    } catch {}
    setIsHandleSubmitted(true);
    setSubmitError(null);
    if (expandedCategoryId) {
      fetchBalance(cleaned, expandedCategoryId);
    }
  };

  // Robust clipboard copy with fallback for mobile in-app browsers
  const handleCopyNomineeLink = (catId: string, nomId: string) => {
    playClickSound();
    const url = `${window.location.origin}/vote?category=${catId}&nominee=${nomId}`;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {
          fallbackCopyText(url);
        });
      } else {
        fallbackCopyText(url);
      }
    } catch {
      fallbackCopyText(url);
    }
    setCopiedNomineeId(nomId);
    setSubmitSuccess("Link copied to clipboard! Share it to get votes!");
    setTimeout(() => {
      setCopiedNomineeId((prev) => (prev === nomId ? null : prev));
      setSubmitSuccess((prev) => (prev?.includes("Link copied") ? null : prev));
    }, 3000);
  };

  // Toggle category accordion with smooth anchor alignment
  const handleToggleCategory = (catId: string) => {
    playClickSound();
    const willOpen = expandedCategoryId !== catId;
    setExpandedCategoryId((prev) => (prev === catId ? null : catId));
    setSubmitSuccess(null);
    setSubmitError(null);

    if (willOpen) {
      setTimeout(() => {
        const el = document.getElementById(`category-${catId}`);
        if (el) {
          const yOffset = -24;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }
      }, 60);
    }
  };

  // VMA Power Hour & Cooldown calculations
  const isPowerHour = Boolean(eventSettings?.power_hour_active);
  const maxBallotCapacity = isPowerHour ? 30 : 10;

  // Active Category Cooldown State
  const activeUnlockAt = expandedCategoryId ? categoryCooldowns[expandedCategoryId] || 0 : 0;
  const isCurrentCategoryInCooldown = activeUnlockAt > now;
  const currentCategoryCooldownMs = isCurrentCategoryInCooldown ? activeUnlockAt - now : 0;

  // Current category credits
  const rawRemaining = balances[expandedCategoryId || ""] ?? maxBallotCapacity;
  const currentRemaining = isCurrentCategoryInCooldown ? 0 : rawRemaining;
  const currentPending = pendingAllocations[expandedCategoryId || ""] || {};
  const currentPendingTotal = Object.values(currentPending).reduce((sum, v) => sum + (v || 0), 0);
  const remainingAfterPending = Math.max(0, currentRemaining - currentPendingTotal);

  // Change vote (+ or -)
  const handleVoteChange = (nomineeId: string, delta: number) => {
    if (!expandedCategoryId) return;

    if (isCurrentCategoryInCooldown) {
      setSubmitError(`Category locked in cooldown. Next ballot unlocks in ${formatCountdown(currentCategoryCooldownMs)}.`);
      return;
    }

    if (!isHandleSubmitted || !voterUsername.trim()) {
      setSubmitError("Please enter and submit your Twitter / X handle above first before voting!");
      window.scrollTo({ top: 140, behavior: "smooth" });
      return;
    }

    const currentVal = currentPending[nomineeId] || 0;
    const nextVal = currentVal + delta;
    if (nextVal < 0) return;

    if (delta > 0 && remainingAfterPending <= 0) {
      setSubmitError(`No remaining vote credits left in this category (${maxBallotCapacity}/${maxBallotCapacity} limit reached).`);
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
    const voter = voterUsername.trim();
    if (!isHandleSubmitted || !voter) {
      setSubmitError("Please enter and submit your Twitter / X handle above before locking in your votes.");
      window.scrollTo({ top: 140, behavior: "smooth" });
      return;
    }
    if (!expandedCategoryId) return;

    if (isCurrentCategoryInCooldown) {
      setSubmitError(`This category is currently in cooldown. Next ballot unlocks in ${formatCountdown(currentCategoryCooldownMs)}.`);
      return;
    }

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
          voter_username: voter,
          category_id: expandedCategoryId,
          allocations: allocationsArray,
          device_id: voterToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Failed to submit votes.");
        if (data.remaining_ms) {
          const unlockTimestamp = Date.now() + data.remaining_ms;
          setCategoryCooldowns((prev) => {
            const next = { ...prev, [expandedCategoryId]: unlockTimestamp };
            try {
              localStorage.setItem("noir_category_cooldowns", JSON.stringify(next));
            } catch {}
            return next;
          });
          setBalances((prev) => ({ ...prev, [expandedCategoryId]: 0 }));
        } else if (typeof data.remaining_votes === "number") {
          setBalances((prev) => ({ ...prev, [expandedCategoryId]: data.remaining_votes }));
        }
      } else {
        playVoteSuccessSound();
        setSubmitSuccess(`Success! Cast ${data.votes_cast} vote credit(s) for this category.${isPowerHour ? " ⚡ Power Hour Triple Vote applied!" : ""}`);
        // Clear pending allocations for this category
        setPendingAllocations((prev) => ({ ...prev, [expandedCategoryId]: {} }));

        // Lock device into cooldown for this category
        const cooldownH = data.cooldown_hours || eventSettings?.cooldown_hours || 3;
        const unlockTimestamp = Date.now() + cooldownH * 3600 * 1000;
        setCategoryCooldowns((prev) => {
          const next = { ...prev, [expandedCategoryId]: unlockTimestamp };
          try {
            localStorage.setItem("noir_category_cooldowns", JSON.stringify(next));
          } catch {}
          return next;
        });
        setBalances((prev) => ({ ...prev, [expandedCategoryId]: 0 }));

        // Confetti explosion
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ["#7bf1a8", "#5eead4", "#ffffff", "#10b981", "#fbbf24"],
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-28 px-4 text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full border-2 border-vma-mint border-t-transparent animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-widest text-chrome-400">Loading Official Ballot...</p>
      </div>
    );
  }

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
          {isPowerHour
            ? "⚡ VMA POWER HOUR ACTIVE: Every fan receives 30 votes per category! Split or stack across your favorites below!"
            : "Every fan gets 10 votes per category. Split or stack your credits across your favorite finalists below!"}
        </p>
      </section>

      {/* VMA POWER HOUR LIVE BANNER */}
      {isPowerHour && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-vma-mint/20 to-amber-500/20 border-2 border-amber-400 text-amber-200 font-mono shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-noir-950 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              <Zap className="w-6 h-6 fill-noir-950 text-noir-950" />
            </div>
            <div className="space-y-0.5 text-left">
              <div className="font-heading font-black text-base sm:text-lg text-white tracking-wide uppercase flex items-center gap-2">
                <span>⚡ VMA POWER HOUR IS LIVE!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-noir-950 font-black uppercase">
                  TRIPLE VOTES
                </span>
              </div>
              <p className="text-xs text-amber-300 font-medium">
                Votes are TRIPLED: Every fan receives <strong className="text-white font-black underline">30 VOTES PER CATEGORY</strong> during this Power Hour!
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-noir-950 border border-amber-400 text-amber-300 text-xs font-black tracking-wider uppercase whitespace-nowrap">
            CAPACITY: 30 VOTES
          </span>
        </div>
      )}

      {/* Voting Closed Notice */}
      {!eventOpen ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-vma-cardDark border border-crimson-600/40 text-center space-y-4 font-mono shadow-2xl max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-crimson-950/80 border border-crimson-500/40 flex items-center justify-center text-crimson-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-heading font-black uppercase text-white tracking-tight">
            VOTING IS CLOSED, CHECK BACK LATER
          </h2>
          <p className="text-xs sm:text-sm text-chrome-400 max-w-md mx-auto leading-relaxed">
            Live voting is currently closed. Nominees and ballots will be unlocked the moment the admin opens live voting!
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-vma-cardDark hover:bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>Return to Homepage</span>
            </Link>
          </div>
        </div>
      ) : (
        /* =========================================================================
            OFFICIAL NOIR GALA '26 CATEGORY ACCORDION LIST (SHOWN ONLY WHEN VOTING IS OPEN)
            ========================================================================= */
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-vma-mint">
              OFFICIAL NOIR GALA '26 BALLOT
            </span>
            <h1 className="text-3xl sm:text-5xl font-heading font-black uppercase text-white tracking-tight">
              VOTE BY CATEGORY
            </h1>
          </div>

          {/* Voter Handle Bar: Input + Submit Button OR Confirmed "VOTE NOW" State */}
          {!isHandleSubmitted ? (
            <div className="max-w-xl mx-auto p-5 rounded-2xl bg-vma-cardDark border border-white/20 shadow-2xl space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-chrome-300 font-bold uppercase flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5 text-vma-mint" />
                  <span>STEP 1: ENTER YOUR TWITTER / X HANDLE</span>
                </span>
                <span className="text-vma-mint font-semibold">10 votes / category</span>
              </div>
              <form onSubmit={handleConfirmVoterHandle} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-chrome-500 font-bold">@</span>
                  <input
                    type="text"
                    placeholder="your_handle"
                    value={inputHandle}
                    onChange={(e) => {
                      setInputHandle(e.target.value);
                      setSubmitError(null);
                    }}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-vma-mint placeholder:text-chrome-600"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-heading font-black text-xs uppercase tracking-widest shadow-vma-mint transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <span>SUBMIT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[11px] text-chrome-400 text-left">
                Enter your Twitter handle and click Submit to activate your ballots and cast votes!
              </p>
            </div>
          ) : (
            <div className="max-w-xl mx-auto p-5 rounded-2xl bg-vma-cardDark border border-vma-mint/60 shadow-vma-mint space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-vma-mint" />
                  <span className="font-heading font-black text-sm uppercase text-white tracking-wide">
                    VOTING AS <span className="text-vma-mint">@{voterUsername}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsHandleSubmitted(false);
                  }}
                  className="text-[11px] text-chrome-400 hover:text-white underline uppercase tracking-wider"
                >
                  Change Handle
                </button>
              </div>

              {/* Prominent VOTE NOW Callout */}
              <div className="p-3.5 rounded-xl bg-vma-mint/15 border border-vma-mint/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vma-mint opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-vma-mint"></span>
                  </span>
                  <span className="font-heading font-black text-base sm:text-lg text-vma-mint tracking-wider uppercase">
                    VOTE NOW
                  </span>
                </div>
                <span className="font-mono text-xs text-chrome-300">
                  {isPowerHour ? "⚡ 30 votes available per category ↓" : "10 votes available per category ↓"}
                </span>
              </div>
            </div>
          )}

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
              const catUnlockAt = categoryCooldowns[cat.id] || 0;
              const isCatInCooldown = catUnlockAt > now;
              const catRemainingMs = isCatInCooldown ? catUnlockAt - now : 0;
              const remaining = isCatInCooldown ? 0 : (balances[cat.id] ?? maxBallotCapacity);

              return (
                <div
                  key={cat.id}
                  id={`category-${cat.id}`}
                  className={`rounded-2xl transition-all border ${
                    isExpanded
                      ? "bg-vma-cardDark border-vma-mint shadow-2xl"
                      : "bg-vma-cardDark/60 border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Accordion Header */}
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

                    {/* Subtitle: Cooldown countdown OR Votes remaining */}
                    <div className="font-mono text-xs sm:text-sm font-semibold tracking-wider">
                      {isCatInCooldown ? (
                        <span className="text-amber-400 flex items-center justify-center gap-1.5 animate-pulse">
                          <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                          <span>COOLDOWN: Next votes unlock in {formatCountdown(catRemainingMs)}</span>
                        </span>
                      ) : (
                        <span className="text-chrome-400">
                          <strong className={isPowerHour ? "text-amber-300 font-black text-sm" : "text-vma-mint"}>
                            {remaining}
                          </strong>
                          /{maxBallotCapacity} votes remaining {isPowerHour && "⚡"}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded Content: Nominee Cards Grid */}
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
                            , or the admin can approve finalists in the admin panel!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {nominees.map((nominee) => {
                            const currentVal = currentPending[nominee.id] || 0;
                            const isHighlighted = highlightedNomineeId === nominee.id;

                            return (
                              <div
                                key={nominee.id}
                                id={`nominee-${nominee.id}`}
                                className={`rounded-2xl overflow-hidden bg-vma-cardDark border transition-all flex flex-col justify-between shadow-card-vma group ${
                                  isHighlighted
                                    ? "border-vma-mint ring-2 ring-vma-mint shadow-vma-mint"
                                    : "border-white/10 hover:border-vma-mint"
                                }`}
                              >
                                {/* Photographic Card Top */}
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

                                  {/* Name, Handle & Share Button Overlay */}
                                  <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
                                    <h3 className="font-heading font-black text-xl sm:text-2xl text-white leading-tight drop-shadow-md">
                                      {nominee.display_name}
                                    </h3>
                                    <div className="flex items-center justify-between gap-2">
                                      <a
                                        href={`https://x.com/${nominee.x_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs text-chrome-300 hover:text-vma-mint flex items-center gap-1 drop-shadow"
                                      >
                                        <span>@{nominee.x_username}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>

                                      {/* One-Click Share / Copy Link Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleCopyNomineeLink(cat.id, nominee.id)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all shadow-md active:scale-95 cursor-pointer select-none ${
                                          copiedNomineeId === nominee.id
                                            ? "bg-vma-mint text-noir-950 border border-vma-mint shadow-vma-mint scale-105"
                                            : "bg-noir-900/90 text-chrome-300 border border-white/20 hover:border-vma-mint hover:text-white"
                                        }`}
                                        title="Copy link to share in DMs or on timeline"
                                      >
                                        {copiedNomineeId === nominee.id ? (
                                          <span className="flex items-center gap-1 text-noir-950 font-black">
                                            <Check className="w-3.5 h-3.5 stroke-[3] text-noir-950" />
                                            <span>COPIED!</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <Share2 className="w-3.5 h-3.5 text-vma-mint" />
                                            <span>SHARE</span>
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* VMA Bottom Stepper Bar */}
                                <div className="py-4 px-6 bg-noir-900/95 border-t border-white/10 flex items-center justify-between select-none">
                                  {/* Minus Button */}
                                  <button
                                    type="button"
                                    aria-label="Subtract vote"
                                    disabled={isCurrentCategoryInCooldown || currentVal <= 0}
                                    onClick={() => handleVoteChange(nominee.id, -1)}
                                    className="w-12 h-12 rounded-full bg-noir-800 hover:bg-noir-700 border border-white/15 text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-noir-800 transition-colors shadow-md active:scale-95"
                                  >
                                    <Minus className="w-5 h-5" />
                                  </button>

                                  {/* Center Vote Display */}
                                  <div className="text-center font-mono">
                                    <div className="text-2xl font-black text-white leading-none">
                                      {currentVal}
                                    </div>
                                    <div className="text-[10px] text-chrome-400 font-bold uppercase tracking-widest mt-0.5">
                                      Votes
                                    </div>
                                  </div>

                                  {/* Plus Button */}
                                  <button
                                    type="button"
                                    aria-label="Add vote"
                                    disabled={isCurrentCategoryInCooldown || remainingAfterPending <= 0}
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
                            {isCurrentCategoryInCooldown ? (
                              <span className="text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                                <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                                <span>Device Cooldown Active: Next votes unlock in {formatCountdown(currentCategoryCooldownMs)}</span>
                              </span>
                            ) : (
                              <span>
                                Pending submission: <strong className="text-white font-bold">{currentPendingTotal}</strong>{" "}
                                vote(s). Remaining after submit:{" "}
                                <strong className={isPowerHour ? "text-amber-300 font-bold" : "text-vma-mint font-bold"}>
                                  {remainingAfterPending}
                                </strong>
                                /{maxBallotCapacity} {isPowerHour && "⚡"}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={!eventOpen || isCurrentCategoryInCooldown || currentPendingTotal <= 0 || isSubmitting}
                            onClick={handleSubmitCategoryVotes}
                            className={`w-full sm:w-auto px-8 py-3 rounded-full font-heading font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                              isCurrentCategoryInCooldown
                                ? "bg-noir-800 text-chrome-500 border border-white/10 cursor-not-allowed opacity-60"
                                : isPowerHour
                                ? "bg-amber-400 hover:bg-amber-300 text-noir-950 shadow-lg shadow-amber-400/30 active:scale-95 cursor-pointer"
                                : "bg-vma-mint hover:bg-vma-mintHover text-noir-950 shadow-vma-mint active:scale-95 cursor-pointer"
                            }`}
                          >
                            {isSubmitting ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>SUBMITTING BALLOT...</span>
                              </>
                            ) : isCurrentCategoryInCooldown ? (
                              <>
                                <Hourglass className="w-4 h-4 text-amber-400" />
                                <span>NEXT BALLOT IN {formatCountdown(currentCategoryCooldownMs)}</span>
                              </>
                            ) : (
                              <>
                                <Vote className="w-4 h-4" />
                                <span>
                                  LOCK IN {currentPendingTotal ? `${currentPendingTotal} ` : ""}{isPowerHour ? "POWER " : ""}VOTES
                                </span>
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
      )}
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
