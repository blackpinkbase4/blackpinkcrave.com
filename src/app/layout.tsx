import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "NOIR STAN AWARDS '26 — MTV VMA STYLE CEREMONY",
  description:
    "ONE TIMELINE. EVERY FANDOM. The premier community-run Stan Twitter awards event inspired by the cinematic broadcast energy of the MTV Video Music Awards. Vote for your favorite creators, fanbases, and editors.",
  keywords: [
    "Noir Stan Awards",
    "Stan Twitter Awards",
    "VMA Stan Awards",
    "MTV Awards Style",
    "Kpop Stan Awards",
    "Pop Culture Awards",
    "Best Fanbase",
    "Best Video Editor",
    "One Timeline Every Fandom",
  ],
  openGraph: {
    title: "NOIR STAN AWARDS '26",
    description: "ONE TIMELINE. EVERY FANDOM. Cast your 10 split votes now.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-noir-950 text-white min-h-screen flex flex-col font-sans selection:bg-vma-mint selection:text-noir-950 relative overflow-x-hidden">
        {/* Master Navigation & App Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
