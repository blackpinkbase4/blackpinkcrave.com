"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle, Upload, Camera, ArrowRight } from "lucide-react";
import { Category } from "@/types";
import { playClickSound, playVoteSuccessSound } from "@/lib/sound";
import { optimizeImageFile } from "@/lib/image-optimizer";

export function HomeNominationForm({
  categories,
  nominationsOpen = true,
}: {
  categories: Category[];
  nominationsOpen?: boolean;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [xUsername, setXUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      const { dataUrl } = await optimizeImageFile(file, 600, 600, 0.82);
      setAvatarUrl(dataUrl);
      setPhotoPreview(dataUrl);
    } catch {
      setErrorMessage("Could not process image. Please try a different photo.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!categoryId || !xUsername.trim() || !displayName.trim()) {
      setErrorMessage("Please fill in the category, X username, and display name.");
      return;
    }

    setSubmitting(true);
    playClickSound();

    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          x_username: xUsername.trim(),
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to submit nomination.");
      } else {
        playVoteSuccessSound();
        setSuccessMessage(`Nomination for @${data.nominee.x_username} submitted successfully!`);
        setXUsername("");
        setDisplayName("");
        setAvatarUrl("");
        setPhotoPreview(null);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!nominationsOpen) {
    return (
      <div id="nominate-section" className="max-w-2xl mx-auto space-y-6">
        <div className="p-8 sm:p-10 rounded-2xl bg-vma-cardDark border border-vma-border text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-vma-mint/10 border border-vma-mint/30 flex items-center justify-center text-vma-mint mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black uppercase text-white tracking-tight">
            NOMINATIONS ARE CLOSED
          </h2>
          <p className="text-xs sm:text-sm text-chrome-400 font-mono max-w-md mx-auto">
            Submissions are now closed as the admin finalizes the official Top 8 ballots. Head over to the voting booth to cast your votes!
          </p>
          <div className="pt-2">
            <a
              href="/vote"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-vma-mint text-noir-950 font-black text-xs uppercase tracking-widest shadow-vma-mint hover:bg-vma-mintHover transition-all"
            >
              <span>ENTER VOTING BOOTH</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="nominate-section" className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vma-mint/10 border border-vma-mint/30 text-vma-mint font-mono text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PHASE 1: CALL FOR NOMINATIONS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-heading font-black uppercase text-white tracking-tight">
          SUBMIT YOUR NOMINEES
        </h2>
        <p className="text-xs sm:text-sm text-chrome-400 font-mono">
          Nominate your favorite Stan Twitter creators below. The admin will select the official
          Top 8 finalists for the live voting ballot!
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-2xl bg-vma-cardDark border border-vma-border space-y-5 shadow-2xl text-left"
      >
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 font-mono">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-crimson-950/80 border border-crimson-500/40 text-crimson-200 text-xs flex items-center gap-3 font-mono">
            <AlertCircle className="w-5 h-5 text-crimson-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-chrome-300">
            1. Select Award Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-vma-mint"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* 2. X Username */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-chrome-300">
            2. X (Twitter) Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chrome-500 font-mono text-sm">
              @
            </span>
            <input
              type="text"
              placeholder="e.g. chartdata"
              value={xUsername}
              onChange={(e) => setXUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-noir-900 border border-white/10 text-white placeholder-chrome-600 font-mono text-xs focus:outline-none focus:border-vma-mint"
            />
          </div>
        </div>

        {/* 3. Display Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-chrome-300">
            3. Nominee Display Name
          </label>
          <input
            type="text"
            placeholder="e.g. Pop Base"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-noir-900 border border-white/10 text-white placeholder-chrome-600 font-mono text-xs focus:outline-none focus:border-vma-mint"
          />
        </div>

        {/* 4. Profile Picture */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-chrome-300">
            4. Profile Photo
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-noir-900 border border-white/15 overflow-hidden flex items-center justify-center shrink-0">
              {photoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-chrome-600" />
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-noir-900 border border-white/15 text-chrome-300 hover:text-white cursor-pointer font-mono text-xs transition-colors">
                <Upload className="w-4 h-4 text-vma-mint" />
                <span>Upload Photo from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                placeholder="or paste direct image URL (https://...)"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setPhotoPreview(e.target.value.trim() || null);
                }}
                className="w-full px-3 py-2 rounded-lg bg-noir-900 border border-white/10 text-white placeholder-chrome-600 font-mono text-xs focus:outline-none focus:border-vma-mint"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-vma-mint hover:bg-vma-mintHover disabled:opacity-50 text-noir-950 font-heading font-black text-xs uppercase tracking-widest shadow-vma-mint transition-all"
        >
          {submitting ? "SUBMITTING NOMINATION..." : "SUBMIT NOMINEE TO BALLOT"}
        </button>
      </form>
    </div>
  );
}
