import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Vote,
  Split,
  Lock,
  Scale,
  Bot,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
export const dynamic = "force-dynamic";

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel-crimson text-crimson-400 text-xs font-bold uppercase tracking-widest shadow-crimson-glow">
          <Scale className="w-3.5 h-3.5" />
          <span>OFFICIAL CODE OF CONDUCT & BALLOT REGULATIONS</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold uppercase font-heading text-chrome">
          VOTING RULES & FAQ
        </h1>
        <p className="text-xs sm:text-sm text-chrome-300 max-w-xl mx-auto">
          Comprehensive guidelines governing the 2026 Noir Stan Awards voting process, integrity
          safeguards, and identity disclosures.
        </p>
      </div>

      {/* Rules Content Sections */}
      <div className="space-y-8">
        {/* Rule 1: 10 Vote Credits Per Category */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-card-noir space-y-4">
          <div className="flex items-center space-x-3 text-crimson-500">
            <Vote className="w-6 h-6" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              1. Ten Vote Units Per Category Per Handle
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-chrome-300 leading-relaxed">
            <p>
              Each entered X (formerly Twitter) handle receives an exact allowance of{" "}
              <strong className="text-white">TEN (10) VOTE CREDITS PER CATEGORY</strong>.
            </p>
            <p>
              Usernames are normalized upon entry (all leading <code className="text-crimson-400">@</code>{" "}
              symbols are stripped, and casing is ignored). Thus,{" "}
              <code className="text-crimson-400">@StanAccount</code>,{" "}
              <code className="text-crimson-400">stanaccount</code>, and{" "}
              <code className="text-crimson-400">@@STANACCOUNT</code> all map to the exact same voter
              quota.
            </p>
          </div>
        </section>

        {/* Rule 2: Split Allocations */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-card-noir space-y-4">
          <div className="flex items-center space-x-3 text-crimson-500">
            <Split className="w-6 h-6" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              2. Split Allocations & Return Ballots
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-chrome-300 leading-relaxed">
            <p>
              Voters are free to distribute their 10 credits however they wish among active nominees
              in each category:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-chrome-300">
              <li>
                <strong className="text-white">Full Stacking:</strong> Give all 10 credits to a single
                nominee.
              </li>
              <li>
                <strong className="text-white">Split Balloting:</strong> Give 7 credits to Nominee A, 2
                credits to Nominee B, and 1 credit to Nominee C.
              </li>
              <li>
                <strong className="text-white">Partial Voting & Returns:</strong> Use 4 credits today
                and return before voting closes to cast your remaining 6 credits.
              </li>
            </ul>
            <p>
              The database server enforces an atomic ceiling of 10 total credits per voter per category.
              Refreshing the page, opening multiple tabs, or modifying requests cannot bypass this limit.
            </p>
          </div>
        </section>

        {/* Rule 3: Voting Windows & Embargo */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-card-noir space-y-4">
          <div className="flex items-center space-x-3 text-crimson-500">
            <Lock className="w-6 h-6" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              3. Voting Window & Results Embargo
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-chrome-300 leading-relaxed">
            <p>
              <strong className="text-white">Active Voting Window:</strong> All ballots must be cast
              while voting is actively open. Once the admin closes voting, the database immediately
              rejects further ballots.
            </p>
            <p>
              <strong className="text-white">Results Embargo:</strong> Live vote tallies and winner
              identities are strictly locked and encrypted until manual publication during the official ceremony broadcast.
            </p>
          </div>
        </section>

        {/* Rule 4: Independent Fan-Event Legal Disclaimer */}
        <section className="p-6 sm:p-8 rounded-3xl bg-noir-900 border border-white/10 space-y-4">
          <div className="flex items-center space-x-3 text-chrome-400">
            <ShieldAlert className="w-6 h-6 text-crimson-500" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              4. Independent Fan-Event Disclaimer
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-chrome-400 leading-relaxed">
            Noir Stan Awards &#39;26 is an independent, non-commercial fan-organized initiative
            honoring Stan Twitter creators, editors, update accounts, and fanbases across K-pop, Western
            music, films, anime, and pop culture. We are not affiliated with, endorsed by, or sponsored
            by MTV, Paramount Global, X Corp. (formerly Twitter), Billboard, or any music artists,
            labels, or management agencies. All logos, handles, and media belong to their respective
            creators.
          </p>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-4">
        <Link
          href="/vote"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white font-bold text-xs uppercase tracking-widest shadow-crimson-glow transition-all"
        >
          <span>Return to Voting Booth</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
