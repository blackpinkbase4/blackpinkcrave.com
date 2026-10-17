import React from "react";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-28 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-crimson-600/20 border border-crimson-500/40 flex items-center justify-center text-crimson-500 mx-auto shadow-crimson-glow">
        <Film className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="font-mono text-5xl font-extrabold text-chrome">404</div>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white">
          TIMELINE SEGMENT NOT FOUND
        </h1>
        <p className="text-xs text-chrome-400">
          The requested page or ceremony sector does not exist on this timeline.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white font-bold text-xs uppercase tracking-wider shadow-crimson-glow transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Main Stage</span>
      </Link>
    </div>
  );
}
