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
  Zap,
  Hourglass,
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
          Comprehensive guidelines governing the 2026 Noir Gala '26 voting process, device cooldown rules,
          Power Hour boosts, and fair-play safeguards.
        </p>
      </div>

      {/* Rules Content Sections */}
      <div className="space-y-8">
        {/* Rule 1: 10 Vote Credits & Periodic Device Cooldown */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-card-noir space-y-4">
          <div className="flex items-center space-x-3 text-crimson-500">
            <Vote className="w-6 h-6" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              1. Ten Vote Units Per Category & Device Cooldown
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-chrome-300 leading-relaxed">
            <p>
              Each entered X (formerly Twitter) handle receives an exact allowance of{" "}
              <strong className="text-white">TEN (10) VOTE CREDITS PER CATEGORY</strong> during each voting cycle.
            </p>
            <p>
              Once a device casts its votes in a category, that category enters a{" "}
              <strong className="text-white">fair-play cooldown period</strong> (with a live countdown timer displayed directly on the ballot).
              When the timer expires, the device automatically replenishes with another 10 fresh credits!
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

        {/* Rule 2: ⚡ Official VMA Power Hour */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-amber-500/40 bg-amber-950/20 shadow-amber-500/10 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center space-x-3 text-amber-400">
            <Zap className="w-6 h-6 fill-amber-400" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide flex items-center gap-2">
              <span>2. ⚡ Official VMA Power Hour (Triple Votes — 30 Votes!)</span>
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-amber-200/90 leading-relaxed">
            <p>
              Inspired by the official MTV Video Music Awards, the ceremony organizers will periodically trigger surprise{" "}
              <strong className="text-white">VMA POWER HOURS</strong>!
            </p>
            <p>
              During an active Power Hour, vote limits are <strong className="text-white uppercase underline">TRIPLED TO 30 VOTES PER CATEGORY</strong>!
              A glowing golden banner and broadcast ticker notification will alert stans the exact moment a Power Hour goes live.
            </p>
            <p>
              Keep your notifications on and rally your fandom on the timeline whenever Power Hour is active to maximize your nominee&apos;s victory margins.
            </p>
          </div>
        </section>

        {/* Rule 3: Split Allocations */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-card-noir space-y-4">
          <div className="flex items-center space-x-3 text-crimson-500">
            <Split className="w-6 h-6" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              3. Split Allocations & Return Ballots
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-chrome-300 leading-relaxed">
            <p>
              Voters are free to distribute their ballot credits however they wish among active finalists
              in each category:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-chrome-300">
              <li>
                <strong className="text-white">Full Stacking:</strong> Give all your credits to a single
                favorite nominee.
              </li>
              <li>
                <strong className="text-white">Split Balloting:</strong> Divide credits among multiple accounts (e.g. 7 to Nominee A, 2 to Nominee B, 1 to Nominee C).
              </li>
              <li>
                <strong className="text-white">Return Ballots:</strong> After the cooldown timer runs down, return to cast another full ballot!
              </li>
            </ul>
          </div>
        </section>

        {/* Rule 4: Fair Play & Anti-Botting Device Locking */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-card-noir space-y-4">
          <div className="flex items-center space-x-3 text-crimson-500">
            <Bot className="w-6 h-6" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              4. Fair Play & Anti-Botting Device Locking
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-chrome-300 leading-relaxed">
            <p>
              To ensure 100% fair competition without tracking or banning innocent IP addresses (which would unfairly punish fans on university dorms or shared home Wi-Fi), our voting booth utilizes <strong className="text-white">Device Ballot Binding</strong>.
            </p>
            <p>
              <strong className="text-white">Username-Switching Exploits Are Blocked:</strong> Simply changing or inventing fake X handles in the username box will <strong className="text-white">not</strong> generate additional votes; the device itself remains locked until the countdown unlocks.
            </p>
            <p>
              Automated script spamming, headless browser bots, and API spoofing are permanently filtered by atomic database constraints and rate-limit shields.
            </p>
          </div>
        </section>

        {/* Rule 5: Voting Windows & Results Embargo */}
        <section className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-card-noir space-y-4">
          <div className="flex items-center space-x-3 text-crimson-500">
            <Lock className="w-6 h-6" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              5. Voting Window & Results Embargo
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

        {/* Rule 6: Independent Fan-Event Legal Disclaimer */}
        <section className="p-6 sm:p-8 rounded-3xl bg-noir-900 border border-white/10 space-y-4">
          <div className="flex items-center space-x-3 text-chrome-400">
            <ShieldAlert className="w-6 h-6 text-crimson-500" />
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              6. Independent Fan-Event Disclaimer
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-chrome-400 leading-relaxed">
            Noir Gala '26 is an independent, non-commercial fan-organized initiative
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
