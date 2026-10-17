import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          950: "#050608",
          900: "#0b0d13",
          850: "#10141d",
          800: "#161b26",
          700: "#222938",
          600: "#323b4e",
        },
        // Official MTV VMA Mint-Green Accent
        vma: {
          mint: "#7bf1a8",
          mintHover: "#62e694",
          mintDark: "#103d27",
          cyan: "#5eead4",
          cardDark: "#0c0f17",
          cardHover: "#121723",
          border: "#1e2638",
        },
      },
      fontFamily: {
        heading: ["'Syne'", "'Oswald'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "vma-mint": "0 0 20px -2px rgba(123, 241, 168, 0.45)",
        "vma-mint-lg": "0 0 35px 0px rgba(123, 241, 168, 0.6)",
        "card-vma": "0 10px 25px -5px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
