import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-10 text-center text-[11px] font-mono text-chrome-500 border-t border-white/5 mt-16 space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-wider font-semibold text-chrome-400">
        <Link href="/" className="hover:text-vma-mint transition-colors">
          Home
        </Link>
        <Link href="/nominate" className="hover:text-vma-mint transition-colors">
          Nominate
        </Link>
        <Link href="/vote" className="hover:text-vma-mint transition-colors">
          Vote
        </Link>
        <Link href="/winners" className="hover:text-vma-mint transition-colors">
          Winners
        </Link>
        <Link href="/rules" className="hover:text-vma-mint transition-colors text-vma-mint">
          Rules & FAQ
        </Link>
        <Link href="/admin" className="hover:text-vma-mint transition-colors">
          Admin
        </Link>
      </div>
      <div>&copy; 2026 Noir Stan Awards &bull; One Timeline. Every Fandom.</div>
    </footer>
  );
}
