"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  Trophy,
  RefreshCw,
  LogOut,
  Download,
  Dices,
  Trash2,
  ExternalLink,
  Sparkles,
  Sliders,
  Flame,
  Check,
  Plus,
  X,
  Crown,
  Music,
  Volume2,
  VolumeX,
  Upload,
} from "lucide-react";
import { Category, Nominee, EventSettings, CategoryWinnerResult } from "@/types";
import { playClickSound, playVoteSuccessSound } from "@/lib/sound";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Tab: "stages" | "nominees" | "results"
  const [activeTab, setActiveTab] = useState<"stages" | "nominees" | "results">("stages");

  // Audio Soundtrack state
  const [songTitle, setSongTitle] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [songEnabled, setSongEnabled] = useState(false);
  const [uploadingSong, setUploadingSong] = useState(false);
  const [savingSong, setSavingSong] = useState(false);

  // Data
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [results, setResults] = useState<CategoryWinnerResult[]>([]);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New category creation modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/me");
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadData = useCallback(async () => {
    try {
      const [sRes, cRes, nRes, rRes] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/categories", { cache: "no-store" }),
        fetch("/api/admin/nominees", { cache: "no-store" }),
        fetch("/api/admin/results", { cache: "no-store" }),
      ]);

      const [sData, cData, nData, rData] = await Promise.all([
        sRes.json(),
        cRes.json(),
        nRes.json(),
        rRes.json(),
      ]);

      if (sData?.settings) {
        setSettings(sData.settings);
        if (sData.settings.music_url !== undefined) setSongUrl(sData.settings.music_url || "");
        if (sData.settings.music_title !== undefined) setSongTitle(sData.settings.music_title || "");
        if (sData.settings.music_enabled !== undefined) setSongEnabled(Boolean(sData.settings.music_enabled));
      }
      if (cData?.categories) {
        setCategories(cData.categories);
        setSelectedCatId((prev) => prev || (cData.categories.length > 0 ? cData.categories[0].id : ""));
      }
      if (nData?.nominees) setNominees(nData.nominees);
      if (rData?.results) setResults(rData.results);
    } catch {}
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Auto-refresh results every 8 seconds on Live Standings tab for real-time tracking
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "results") return;
    const timer = setInterval(() => {
      loadData();
    }, 8000);
    return () => clearInterval(timer);
  }, [isAuthenticated, activeTab, loadData]);

  // Lazy-load detailed category nominees with avatars for selected category in Tab 2
  useEffect(() => {
    if (isAuthenticated && selectedCatId) {
      fetch(`/api/admin/nominees?categoryId=${encodeURIComponent(selectedCatId)}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.nominees && data.nominees.length > 0) {
            setNominees((prev) => {
              const others = prev.filter((n) => n.category_id !== selectedCatId);
              return [...others, ...data.nominees];
            });
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, selectedCatId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    playClickSound();

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passcode, secret: passcode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Authentication failed.");
      } else {
        playVoteSuccessSound();
        setIsAuthenticated(true);
        setPasscode("");
        loadData();
      }
    } catch {
      setAuthError("Network error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    playClickSound();
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  // Toggle Event Settings (Nominations, Voting, Winners)
  const handleUpdateSettings = async (updates: Partial<EventSettings>) => {
    setNotice(null);
    setError(null);
    playClickSound();

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data?.settings) {
        setSettings(data.settings);
        setNotice("Ceremony stage updated successfully!");
        loadData();
      }
    } catch {
      setError("Failed to update stage");
    }
  };

  // Roll Random 8 Finalists for selected category
  const handleRollRandom8 = async (catId: string) => {
    setNotice(null);
    setError(null);
    setActionLoading(true);
    playClickSound();

    try {
      const res = await fetch("/api/admin/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "roll_8", category_id: catId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to roll 8 finalists");
      } else {
        playVoteSuccessSound();
        setNotice(`🎲 Rolled and approved 8 finalists for this category!`);
        loadData();
      }
    } catch {
      setError("Error rolling finalists");
    } finally {
      setActionLoading(false);
    }
  };

  // Approve all nominees (either for selected category or all categories)
  const handleApproveAll = async (catId?: string) => {
    const isAllCategories = !catId || catId === "all";
    const targetCategoryTitle = categories.find((c) => c.id === catId)?.title;
    const confirmMsg = isAllCategories
      ? `Are you sure you want to approve ALL ${nominees.length} community submissions across ALL categories to the live voting ballot?`
      : `Are you sure you want to approve all ${categoryNominees.length} community submissions in "${targetCategoryTitle || "this category"}" to the live voting ballot?`;

    if (!confirm(confirmMsg)) return;

    setNotice(null);
    setError(null);
    setActionLoading(true);
    playClickSound();

    try {
      const res = await fetch("/api/admin/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_all", category_id: isAllCategories ? "all" : catId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to approve nominees");
      } else {
        playVoteSuccessSound();
        setNotice(`✓ Approved all submissions (${data.count || 0}) as official finalists!`);
        loadData();
      }
    } catch {
      setError("Error approving all nominees");
    } finally {
      setActionLoading(false);
    }
  };

  // Audio upload handler: Direct-to-Supabase upload via signed URL (bypasses Netlify 6MB body limit!)
  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSong(true);
    setError(null);
    setNotice(null);
    try {
      // Step 1: Request signed upload URL from admin API (lightweight JSON, < 1KB)
      const res = await fetch("/api/admin/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.signedUrl) {
        throw new Error(data.error || "Failed to initialize audio upload");
      }

      // Step 2: Upload audio file directly from browser to Supabase Storage CDN
      const uploadRes = await fetch(data.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "audio/mpeg",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Direct storage upload failed. Please try again.");
      }

      setSongUrl(data.publicUrl);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
      if (!songTitle.trim()) {
        setSongTitle(cleanTitle);
      }
      playVoteSuccessSound();
      setNotice("Audio uploaded directly to Supabase Storage! Click 'SAVE SOUNDTRACK' to activate it.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading audio file";
      setError(msg);
    } finally {
      setUploadingSong(false);
    }
  };

  const handleSaveSoundtrack = async () => {
    if (!songUrl.trim()) {
      setError("Please paste an Audio URL (such as your Catbox link) or upload an MP3 file first before saving!");
      return;
    }
    setSavingSong(true);
    setError(null);
    playClickSound();
    try {
      await handleUpdateSettings({
        music_url: songUrl.trim(),
        music_title: (songTitle.trim() || "XG - GALA"),
        music_enabled: songEnabled,
      });
      playVoteSuccessSound();
      setNotice("Ceremony soundtrack saved and activated successfully!");
    } catch {
      setError("Failed to save soundtrack settings");
    } finally {
      setSavingSong(false);
    }
  };

  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;
    setAddingCat(true);
    setError(null);
    playClickSound();

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          data: {
            title: newCatTitle.trim(),
            description: newCatDesc.trim(),
            icon: "Trophy",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create category");
      } else {
        playVoteSuccessSound();
        setNotice(`Created new category: "${data.category.title}"!`);
        setNewCatTitle("");
        setNewCatDesc("");
        setShowAddCatModal(false);
        loadData();
        setSelectedCatId(data.category.id);
      }
    } catch {
      setError("Network error while creating category");
    } finally {
      setAddingCat(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!confirm(`Are you sure you want to delete category "${cat?.title || id}"? All nominations in this category will also be removed. This cannot be undone.`)) {
      return;
    }
    playClickSound();
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to delete category");
      } else {
        playVoteSuccessSound();
        setNotice(`Category deleted successfully.`);
        setCategories((prev) => {
          const next = prev.filter((c) => c.id !== id);
          if (selectedCatId === id) {
            setSelectedCatId(next.length > 0 ? next[0].id : "");
          }
          return next;
        });
        loadData();
      }
    } catch {
      setError("Network error deleting category");
    }
  };

  // Toggle specific finalist
  const handleToggleFinalist = async (id: string, current: boolean) => {
    playClickSound();
    try {
      await fetch("/api/admin/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_finalist",
          id,
          data: { is_finalist: !current },
        }),
      });
      loadData();
    } catch {}
  };

  // Delete nominee
  const handleDeleteNominee = async (id: string) => {
    if (!confirm("Delete this nomination?")) return;
    playClickSound();
    try {
      await fetch("/api/admin/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      loadData();
    } catch {}
  };

  // Manually pick winner for a category
  const handleSetCategoryWinner = async (categoryId: string, nomineeId: string | null) => {
    playClickSound();
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_winner",
          id: categoryId,
          data: { nominee_id: nomineeId },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to set winner");
      } else {
        playVoteSuccessSound();
        setNotice(
          nomineeId
            ? "👑 Winner manually crowned for this category!"
            : "Reset winner to highest vote total."
        );
        loadData();
      }
    } catch {
      setError("Error setting category winner");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 space-y-6 font-mono">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-vma-mint/10 border border-vma-mint/40 flex items-center justify-center text-vma-mint mx-auto shadow-vma-mint">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-heading font-black uppercase text-white tracking-tight">
            ADMIN DESK
          </h1>
          <p className="text-xs text-chrome-400">Enter password to access ceremony stage controls.</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 rounded-2xl bg-vma-cardDark border border-vma-border space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-chrome-300 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-vma-mint"
            />
            {authError && <p className="text-xs text-crimson-400 mt-2">{authError}</p>}
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3.5 rounded-xl bg-vma-mint hover:bg-vma-mintHover text-noir-950 font-heading font-black text-xs uppercase tracking-widest shadow-vma-mint transition-all"
          >
            {authLoading ? "AUTHENTICATING..." : "UNLOCK CONTROL DESK"}
          </button>
        </form>
      </div>
    );
  }

  const categoryNominees = nominees.filter((n) => n.category_id === selectedCatId);
  const categoryFinalists = categoryNominees.filter((n) => n.is_finalist);
  const grandTotalVotes = results.reduce((sum, c) => sum + (c.total_votes || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase text-white tracking-tight">
              ADMIN CONTROL ROOM
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-vma-mint/20 text-vma-mint border border-vma-mint/40 text-[10px] font-bold uppercase">
              MASTER DESK
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-vma-mint/10 border border-vma-mint/40 text-vma-mint text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-vma-mint animate-pulse" />
              <span>LIVE TOTAL: <strong className="text-white font-black">{grandTotalVotes.toLocaleString()}</strong> VOTES</span>
            </div>
          </div>
          <p className="text-xs text-chrome-400 mt-1">
            Manage the 4 ceremony stages: Nominations &rarr; Top 8 Curation &rarr; Live Voting &rarr; Winner Reveal.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/api/admin/export"
            download
            className="px-4 py-2 rounded-xl bg-noir-900 border border-white/15 text-white hover:border-vma-mint text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-vma-mint" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-noir-900 border border-crimson-500/40 text-crimson-400 hover:bg-crimson-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-crimson-950/80 border border-crimson-500/40 text-crimson-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-crimson-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {[
          { id: "stages", label: "1. Ceremony Stage Controls", icon: Sliders },
          { id: "nominees", label: `2. Curate Top 8 (${nominees.length} Submissions)`, icon: Users },
          { id: "results", label: "3. Live Standings & Winners", icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                isActive
                  ? "bg-vma-mint text-noir-950 shadow-vma-mint"
                  : "bg-vma-cardDark text-chrome-400 hover:text-white border border-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: CEREMONY STAGE CONTROLS (THE 4 STAGES)
          ========================================================================= */}
      {activeTab === "stages" && settings && (
        <div className="space-y-6">
          {/* Ceremony Stage Status Overview Bar */}
          <div className="p-4 rounded-2xl bg-vma-cardDark border border-vma-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span className="text-chrome-400 font-bold uppercase tracking-wider">ACTIVE CEREMONY PHASES:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  settings.nominations_open
                    ? "bg-vma-mint/20 border-vma-mint text-vma-mint shadow-vma-mint"
                    : "bg-noir-900 border-white/10 text-chrome-500"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${settings.nominations_open ? "bg-vma-mint animate-pulse" : "bg-chrome-600"}`} />
                1. Submissions: {settings.nominations_open ? "OPEN" : "CLOSED"}
              </span>
              <span
                className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  settings.nominees_visible
                    ? "bg-vma-mint/20 border-vma-mint text-vma-mint shadow-vma-mint"
                    : "bg-noir-900 border-white/10 text-chrome-500"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${settings.nominees_visible ? "bg-vma-mint animate-pulse" : "bg-chrome-600"}`} />
                2. Nominees: {settings.nominees_visible ? "SHOWING" : "HIDDEN"}
              </span>
              <span
                className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  settings.voting_open
                    ? "bg-vma-mint/20 border-vma-mint text-vma-mint shadow-vma-mint"
                    : "bg-noir-900 border-white/10 text-chrome-500"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${settings.voting_open ? "bg-vma-mint animate-pulse" : "bg-chrome-600"}`} />
                3. Voting: {settings.voting_open ? "OPEN" : "CLOSED"}
              </span>
              <span
                className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  settings.winners_published
                    ? "bg-vma-mint/20 border-vma-mint text-vma-mint shadow-vma-mint"
                    : "bg-noir-900 border-white/10 text-chrome-500"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${settings.winners_published ? "bg-vma-mint animate-pulse" : "bg-chrome-600"}`} />
                4. Winners: {settings.winners_published ? "REVEALED" : "SEALED"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stage 1: Nominations */}
            <div
              className={`p-6 rounded-2xl bg-vma-cardDark border transition-all space-y-4 shadow-xl ${
                settings.nominations_open ? "border-vma-mint/60 shadow-vma-mint" : "border-vma-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-vma-mint uppercase tracking-widest">STAGE 1</span>
                {settings.nominations_open ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE & OPEN
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-chrome-500 text-[10px] font-bold uppercase tracking-wider">
                    LOCKED / OFF
                  </span>
                )}
              </div>
              <h3 className="text-base font-heading font-black text-white uppercase">1. SUBMISSIONS</h3>
              <p className="text-xs text-chrome-400">
                Fans submit handles and profile photos at <code className="text-vma-mint">/nominate</code>.
              </p>

              <div className="p-4 rounded-xl bg-noir-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-chrome-400 font-semibold">STATUS:</span>
                  <span className={settings.nominations_open ? "text-vma-mint font-black" : "text-chrome-400 font-bold"}>
                    {settings.nominations_open ? "ACCEPTING ENTRIES" : "PAUSED"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ nominations_open: !settings.nominations_open })}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.nominations_open
                      ? "bg-noir-800 hover:bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-md"
                      : "bg-vma-mint hover:bg-vma-mintHover text-noir-950 shadow-vma-mint"
                  }`}
                >
                  {settings.nominations_open ? "✕ CLOSE SUBMISSIONS" : "✓ OPEN SUBMISSIONS"}
                </button>
              </div>
            </div>

            {/* Stage 2: Show Nominees Roster */}
            <div
              className={`p-6 rounded-2xl bg-vma-cardDark border transition-all space-y-4 shadow-xl ${
                settings.nominees_visible ? "border-vma-mint/60 shadow-vma-mint" : "border-vma-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-vma-mint uppercase tracking-widest">STAGE 2</span>
                {settings.nominees_visible ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    PUBLIC ROSTER
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-chrome-500 text-[10px] font-bold uppercase tracking-wider">
                    LOCKED / OFF
                  </span>
                )}
              </div>
              <h3 className="text-base font-heading font-black text-white uppercase">2. SHOW NOMINEES</h3>
              <p className="text-xs text-chrome-400">
                Displays the approved nominees under each category at <code className="text-vma-mint">/nominees</code>.
              </p>

              <div className="p-4 rounded-xl bg-noir-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-chrome-400 font-semibold">STATUS:</span>
                  <span className={settings.nominees_visible ? "text-vma-mint font-black" : "text-chrome-400 font-bold"}>
                    {settings.nominees_visible ? "ROSTER LIVE" : "ROSTER HIDDEN"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ nominees_visible: !settings.nominees_visible })}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.nominees_visible
                      ? "bg-noir-800 hover:bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-md"
                      : "bg-vma-mint hover:bg-vma-mintHover text-noir-950 shadow-vma-mint"
                  }`}
                >
                  {settings.nominees_visible ? "✕ HIDE NOMINEES" : "✓ SHOW NOMINEES"}
                </button>
              </div>
            </div>

            {/* Stage 3: Live Voting */}
            <div
              className={`p-6 rounded-2xl bg-vma-cardDark border transition-all space-y-4 shadow-xl ${
                settings.voting_open ? "border-vma-mint/60 shadow-vma-mint" : "border-vma-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-vma-mint uppercase tracking-widest">STAGE 3</span>
                {settings.voting_open ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE & OPEN
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-chrome-500 text-[10px] font-bold uppercase tracking-wider">
                    LOCKED / OFF
                  </span>
                )}
              </div>
              <h3 className="text-base font-heading font-black text-white uppercase">3. LIVE VOTING</h3>
              <p className="text-xs text-chrome-400">
                The VMA ballot is live at <code className="text-vma-mint">/vote</code> for approved finalists.
              </p>

              <div className="p-4 rounded-xl bg-noir-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-chrome-400 font-semibold">STATUS:</span>
                  <span className={settings.voting_open ? "text-vma-mint font-black" : "text-chrome-400 font-bold"}>
                    {settings.voting_open ? "BALLOT LIVE" : "VOTING PAUSED"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ voting_open: !settings.voting_open })}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.voting_open
                      ? "bg-noir-800 hover:bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-md"
                      : "bg-vma-mint hover:bg-vma-mintHover text-noir-950 shadow-vma-mint"
                  }`}
                >
                  {settings.voting_open ? "✕ CLOSE VOTING" : "✓ OPEN VOTING"}
                </button>
              </div>
            </div>

            {/* Stage 4: Winner Reveal */}
            <div
              className={`p-6 rounded-2xl bg-vma-cardDark border transition-all space-y-4 shadow-xl ${
                settings.winners_published ? "border-vma-mint/60 shadow-vma-mint" : "border-vma-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-vma-mint uppercase tracking-widest">STAGE 4</span>
                {settings.winners_published ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    REVEALED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-chrome-500 text-[10px] font-bold uppercase tracking-wider">
                    SEALED
                  </span>
                )}
              </div>
              <h3 className="text-base font-heading font-black text-white uppercase">4. WINNER PODIUM</h3>
              <p className="text-xs text-chrome-400">
                Certified winners and victory cards are revealed at <code className="text-vma-mint">/winners</code>.
              </p>

              <div className="p-4 rounded-xl bg-noir-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-chrome-400 font-semibold">STATUS:</span>
                  <span className={settings.winners_published ? "text-vma-mint font-black" : "text-chrome-400 font-bold"}>
                    {settings.winners_published ? "REVEALED LIVE" : "SEALED"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings({ winners_published: !settings.winners_published })}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.winners_published
                      ? "bg-noir-800 hover:bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-md"
                      : "bg-vma-mint hover:bg-vma-mintHover text-noir-950 shadow-vma-mint"
                  }`}
                >
                  {settings.winners_published ? "🔒 HIDE WINNERS" : "👑 REVEAL WINNERS"}
                </button>
              </div>
            </div>
          </div>

          {/* GALA DAILY SOUNDTRACK MANAGER CARD */}
          <div className="p-6 rounded-2xl bg-vma-cardDark border border-vma-border space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vma-mint/10 border border-vma-mint/30 text-vma-mint text-[11px] font-bold uppercase tracking-wider">
                  <Music className="w-3.5 h-3.5" />
                  <span>CEREMONY AUDIO / SONG OF THE DAY</span>
                </div>
                <h3 className="text-lg font-heading font-black text-white uppercase">
                  DAILY GALA SOUNDTRACK
                </h3>
                <p className="text-xs text-chrome-400 font-mono">
                  Plays in the background across the site on first click. Users can mute or unmute anytime with 1 tap.
                </p>
              </div>

              {/* Enable / Disable Toggle */}
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => setSongEnabled(!songEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                    songEnabled
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm"
                      : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {songEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                  <span>{songEnabled ? "SOUNDTRACK: ACTIVE (PLAYS ON SITE)" : "SOUNDTRACK: MUTED (OFF)"}</span>
                </button>
                <span className="text-[10px] text-chrome-500 font-mono">
                  {songEnabled ? "Fans will hear this music when visiting" : "Music is completely silenced across the site"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Song Title & Artist */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-chrome-300">
                  Track Name / Artist Display
                </label>
                <input
                  type="text"
                  placeholder="e.g. APT. - ROSÉ & Bruno Mars"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-vma-mint placeholder-chrome-600"
                />
              </div>

              {/* Audio URL or Direct File Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-chrome-300">
                  Audio URL (MP3 stream or direct link)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://.../song.mp3"
                    value={songUrl}
                    onChange={(e) => setSongUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-vma-mint placeholder-chrome-600"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-noir-800 hover:bg-noir-700 border border-white/20 text-chrome-300 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingSong ? "Uploading..." : "Upload MP3"}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleUploadAudio}
                      className="hidden"
                      disabled={uploadingSong}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-mono truncate max-w-xs ${songUrl ? "text-emerald-400 font-bold" : "text-amber-400 font-semibold"}`}>
                  {songUrl ? `✓ Audio Loaded: ${songUrl}` : "⚠ Paste your Catbox link or click Upload MP3"}
                </span>
                {songUrl && (
                  <audio src={songUrl} controls className="h-8 max-w-[200px]" preload="metadata" />
                )}
              </div>
              <button
                type="button"
                disabled={savingSong || uploadingSong}
                onClick={handleSaveSoundtrack}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-vma-mint hover:bg-vma-mintHover disabled:opacity-40 text-noir-950 font-black text-xs uppercase tracking-wider shadow-vma-mint transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Music className="w-4 h-4" />
                <span>{savingSong ? "SAVING..." : "SAVE SOUNDTRACK"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CURATE TOP 8 FINALISTS (ROLL RANDOM 8)
          ========================================================================= */}
      {activeTab === "nominees" && (
        <div className="space-y-6">
          {/* Category Selector Bar */}
          <div className="p-4 rounded-2xl bg-vma-cardDark border border-vma-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-chrome-400 font-bold uppercase">CATEGORY:</span>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="px-4 py-2 rounded-xl bg-noir-900 border border-white/15 text-white text-xs focus:outline-none focus:border-vma-mint max-w-[200px] sm:max-w-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowAddCatModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-vma-cardDark hover:bg-white/10 border border-vma-mint/40 text-vma-mint text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>

              {categories.length > 0 && selectedCatId && (
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(selectedCatId)}
                  className="px-3.5 py-2 rounded-xl bg-crimson-950/60 hover:bg-crimson-900 border border-crimson-500/40 text-crimson-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                  title="Delete this category"
                >
                  <Trash2 className="w-3.5 h-3.5 text-crimson-400" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Action Buttons: APPROVE ALL + Roll Random 8 */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                disabled={actionLoading || categoryNominees.length === 0}
                onClick={() => handleApproveAll(selectedCatId)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-noir-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                title="Approve all community submissions in this category as finalists for the ballot"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ APPROVE CATEGORY ({categoryNominees.length})</span>
              </button>

              <button
                type="button"
                disabled={actionLoading || nominees.length === 0}
                onClick={() => handleApproveAll("all")}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-vma-mint hover:bg-vma-mintHover disabled:opacity-40 text-noir-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-vma-mint transition-all cursor-pointer"
                title="Approve ALL community submissions across ALL categories in one click"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ APPROVE ALL ({nominees.length}) GLOBALLY</span>
              </button>

              <button
                type="button"
                disabled={actionLoading || categoryNominees.length === 0}
                onClick={() => handleRollRandom8(selectedCatId)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-noir-800 hover:bg-noir-700 border border-white/20 disabled:opacity-40 text-chrome-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Randomly pick 8 finalists for this category"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>ROLL 8</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-chrome-400">
            Current Category: <strong className="text-white">{categoryNominees.length}</strong> community submissions,{" "}
            <strong className="text-vma-mint">{categoryFinalists.length}</strong> approved finalists for the live ballot (target: 8).
          </div>

          {/* Nominees Grid */}
          {categoryNominees.length === 0 ? (
            <div className="p-12 rounded-2xl bg-vma-cardDark border border-white/10 text-center space-y-2 text-chrome-500">
              <Users className="w-8 h-8 mx-auto text-chrome-600" />
              <p>No community submissions for this category yet.</p>
              <p className="text-[11px]">
                Submit the first one at{" "}
                <Link href="/nominate" className="text-vma-mint underline">
                  /nominate
                </Link>
                !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryNominees.map((nom) => (
                <div
                  key={nom.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                    nom.is_finalist
                      ? "bg-noir-900 border-vma-mint shadow-vma-mint"
                      : "bg-vma-cardDark border-white/10 opacity-75"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {nom.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={nom.avatar_url}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-noir-800 flex items-center justify-center font-bold text-white text-lg shrink-0">
                          {nom.display_name.charAt(0)}
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <div className="font-bold text-white text-sm truncate">{nom.display_name}</div>
                        <div className="text-vma-mint text-xs font-mono truncate">@{nom.x_username}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleFinalist(nom.id, nom.is_finalist)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                        nom.is_finalist
                          ? "bg-vma-mint text-noir-950 font-black"
                          : "bg-noir-800 text-chrome-400 hover:text-white"
                      }`}
                    >
                      {nom.is_finalist ? "✓ TOP 8 BALLOT" : "+ APPROVE"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNominee(nom.id)}
                      className="p-1 text-chrome-600 hover:text-crimson-400"
                      title="Delete nomination"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: LIVE STANDINGS & RESULTS
          ========================================================================= */}
      {activeTab === "results" && (
        <div className="space-y-6">
          {/* Real-time Grand Total Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-noir-900 via-vma-cardDark to-noir-900 border border-vma-mint/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-vma-mint">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-vma-mint/20 border border-vma-mint/50 flex items-center justify-center text-vma-mint shadow-sm shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                    GRAND TOTAL VOTES ACROSS ALL CATEGORIES
                  </h3>
                  <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-vma-mint/20 text-vma-mint border border-vma-mint/40 font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-vma-mint animate-pulse" />
                    LIVE REAL-TIME
                  </span>
                </div>
                <p className="text-xs text-chrome-400 font-mono mt-0.5">
                  Full un-capped vote tally dynamically calculated across every submitted ballot
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <div className="text-3xl sm:text-5xl font-heading font-black text-vma-mint tracking-tight">
                {grandTotalVotes.toLocaleString()}
              </div>
              <span className="text-[10px] uppercase font-bold text-chrome-400 tracking-wider">
                Total Vote Credits Cast
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((cat) => (
            <div key={cat.category_id} className="p-5 rounded-2xl bg-vma-cardDark border border-vma-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h4 className="font-bold text-white uppercase text-sm">{cat.category_title}</h4>
                  <span className="text-[10px] text-vma-mint">Total: {cat.total_votes} votes</span>
                </div>
                {cat.manual_winner_id ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      MANUAL WINNER
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetCategoryWinner(cat.category_id, null)}
                      className="text-[10px] text-chrome-400 hover:text-white underline font-bold"
                    >
                      Reset to Votes
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-chrome-400 font-mono">
                    Auto: Highest Votes Wins
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {cat.nominees.length === 0 ? (
                  <p className="text-xs text-chrome-500">No approved finalists in this category yet.</p>
                ) : (
                  cat.nominees.map((nom, rank) => (
                    <div
                      key={nom.nominee_id}
                      className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
                        nom.is_winner
                          ? "bg-vma-mint/15 border border-vma-mint text-white font-bold shadow-vma-mint"
                          : "bg-noir-900/60 border border-white/5 text-chrome-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-chrome-500 font-mono font-bold text-xs">#{rank + 1}</span>
                        <span className="font-heading font-black text-white text-sm">{nom.display_name}</span>
                        <span className="text-vma-mint font-mono text-xs">@{nom.x_username}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="font-mono text-left sm:text-right">
                          <strong className="text-white">{nom.votes}</strong> ({nom.percentage}%)
                        </div>

                        {nom.is_winner ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-vma-mint text-noir-950 font-black text-[10px] uppercase flex items-center gap-1 shadow-vma-mint">
                              <Crown className="w-3 h-3" />
                              WINNER
                            </span>
                            {cat.manual_winner_id === nom.nominee_id && (
                              <button
                                type="button"
                                onClick={() => handleSetCategoryWinner(cat.category_id, null)}
                                className="text-[10px] text-chrome-500 hover:text-white underline"
                                title="Unset manual winner"
                              >
                                Uncrown
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCategoryWinner(cat.category_id, nom.nominee_id)}
                            className="px-2.5 py-1 rounded-lg bg-noir-800 hover:bg-vma-mint hover:text-noir-950 text-chrome-300 text-[10px] font-bold uppercase transition-all border border-white/15 flex items-center gap-1 shadow-sm"
                            title="Manually crown as category winner"
                          >
                            <Crown className="w-3 h-3 text-vma-mint" />
                            <span>Pick as Winner</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md rounded-2xl bg-vma-cardDark border border-vma-border p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-vma-mint" />
                <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight">
                  CREATE NEW CATEGORY
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="text-chrome-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-chrome-300 mb-1.5">
                  Category Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best Timeline Meme Lord"
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-noir-900 border border-white/15 text-white text-xs focus:outline-none focus:border-vma-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-chrome-300 mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Honoring the creators behind viral stan tweets, reactions, and memes."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-noir-900 border border-white/15 text-white text-xs focus:outline-none focus:border-vma-mint resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-noir-900 hover:bg-noir-800 text-chrome-400 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCat || !newCatTitle.trim()}
                  className="px-6 py-2 rounded-xl bg-vma-mint hover:bg-vma-mintHover disabled:opacity-40 text-noir-950 font-black text-xs uppercase tracking-wider shadow-vma-mint transition-all flex items-center gap-1.5"
                >
                  {addingCat ? "CREATING..." : "CREATE CATEGORY"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
