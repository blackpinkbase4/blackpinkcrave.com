# NOIR STAN AWARDS '26 🏆
> **ONE TIMELINE. EVERY FANDOM.**
> Inspired by the cinematic atmosphere of the MTV Video Music Awards, celebrating Stan Twitter creators, fanbases, update accounts, video editors, and icons across every fandom.

---

## 1. Project Overview

The **Noir Stan Awards '26** is a full-stack web application designed for a premier community-run awards ceremony. Built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase PostgreSQL, the platform delivers a cinematic noir aesthetic (deep black backgrounds, crimson-red accents, and metallic chrome typography) paired with a high-integrity voting system.

### Key Highlights
- **Friction-Free Username-Only Voting:** Voters simply enter their X (Twitter) handle (e.g., `@example`). No passwords, magic links, or emails required.
- **Ten-Vote Split System:** Every handle receives **10 vote units per category**. Voters can stack all 10 on one nominee or split them (e.g. 7 for Nominee A, 3 for Nominee B), and return later before the cutoff to cast any remaining units.
- **Atomic Concurrency Protection:** Race-condition-proof transaction locking prevents concurrent requests or tab refreshes from exceeding the 10-vote hard limit.
- **Strict Results Embargo:** Live vote tallies and winner standings remain confidential until manually unlocked by the organizer for the ceremony broadcast (**October 18, 2026**).
- **Protected Organizer Control Desk (`/admin`):** Full CRUD for categories and nominees, voting booth toggle, deadline & timezone picker, suspicious bot activity detection, CSV export, and audit logs.
- **Netlify & Supabase Ready:** Preconfigured with `@netlify/plugin-nextjs`, ready for one-click deployment.

---

## 2. Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions & Serverless API Routes)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Custom cinematic noir, crimson, and chrome palette)
- **Database:** [Supabase](https://supabase.com/) PostgreSQL (Row Level Security + Atomic Stored Procedure)
- **Icons & Graphics:** [Lucide React](https://lucide.dev/) + Custom SVG Metallic Trophy
- **Testing:** [Vitest](https://vitest.dev/) (Unit and integration test suite)
- **Hosting:** [Netlify](https://www.netlify.com/) (Next.js App Router support)

---

## 3. Award Categories Seeded

The database is pre-seeded with the 10 official categories:
1. **Best Fanbase Account** (`best-fanbase`)
2. **Best Update Account** (`best-update`)
3. **Best Voting & Streaming Account** (`best-voting-streaming`)
4. **Best Charts Account** (`best-charts`)
5. **Best Graphics Designer** (`best-graphics-designer`)
6. **Best Video Editor** (`best-video-editor`)
7. **Funniest Stan Account** (`funniest-stan`)
8. **Best New Account** (`best-new-account`)
9. **Most Iconic Account** (`most-iconic-account`)
10. **People's Choice Award** (`peoples-choice`)

*Note: Per the guidelines, nominee lists start empty. The organizer adds and manages nominees directly via the `/admin` dashboard.*

---

## 4. Local Quick Start

### Prerequisites
- Node.js `v18.17.0` or later (tested on Node `v24.14.0`)
- npm `v9+` or later

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Admin Authentication Passphrase
ADMIN_SECRET=noir_admin_secret_2026_change_in_production

# Optional Anti-Bot CAPTCHA (leave blank for permissive mode)
NEXT_PUBLIC_CAPTCHA_SITE_KEY=
CAPTCHA_SECRET_KEY=

# Public App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note on Local Dev Mode:** If Supabase credentials are not yet added, the platform automatically runs in **local development storage mode** with all 10 categories active, enabling full offline testing, voting verification, and admin controls.

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Supabase Database Setup

1. Create a free project at [supabase.com](https://supabase.com/).
2. In the Supabase project dashboard, navigate to the **SQL Editor**.
3. Open `supabase/schema.sql` from this repository, copy its entire contents, paste it into the SQL editor, and click **Run**.
4. The script will:
   - Create tables: `event_settings`, `categories`, `nominees`, `votes`, `audit_logs`
   - Enable **Row Level Security (RLS)** ensuring public visitors cannot read or alter raw vote records
   - Define the atomic function `submit_category_votes` with PostgreSQL transaction-level advisory locks
   - Define the credit balance reader `get_voter_category_balance`
   - Seed default settings and all 10 official categories
5. Go to **Project Settings -> API** in Supabase:
   - Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role secret** into `SUPABASE_SERVICE_ROLE_KEY` *(Never expose this in client code!)*

---

## 6. Netlify Deployment Guide

1. Push this repository to **GitHub**.
2. Log into [Netlify](https://app.netlify.com/) and click **Add new site** -> **Import an existing project**.
3. Select your GitHub repository.
4. Netlify will auto-detect the Next.js settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Plugin:** `@netlify/plugin-nextjs`
5. In **Site configuration -> Environment variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_SECRET`
   - `NEXT_PUBLIC_APP_URL` (set to your Netlify URL, e.g. `https://noir-stan-awards-26.netlify.app`)
6. Click **Deploy Site**.

---

## 7. Organizer Administration (`/admin`)

Access the protected organizer dashboard at `/admin`.
Enter the passphrase configured in your `ADMIN_SECRET` environment variable (default: `noir_admin_secret_2026_change_in_production`).

From the control desk, you can:
- **Toggle Voting Booth:** Open or close voting instantly.
- **Set Voting Cutoff:** Adjust deadline timestamp and display timezone.
- **Manage Categories:** Add, edit, or toggle categories active/inactive.
- **Manage Finalist Nominees:** Add nominee X handles, display names, profile photo URLs, and bios.
- **Live Standings Preview:** Privately inspect real-time vote totals and percentages while they remain under wraps from the public.
- **Publish / Embargo Winners:** One-click toggle to reveal winners globally at `/winners` or hide them under embargo.
- **Fraud Defense & Bot Analytics:** Review IP cluster spikes, burst minute activity, and high-frequency voting accounts.
- **Export CSV:** One-click download of all verified results with handles, vote counts, and winner/tie status.
- **Audit Logs:** Full history of administrative actions.

---

## 8. Testing & Quality Assurance

Run the automated test suite:
```bash
npm test
```

Run TypeScript strict type checking:
```bash
npm run type-check
```

Build production bundle:
```bash
npm run build
```

---

## 9. Legal & Community Disclaimer

**Noir Stan Awards '26** is an independent, non-commercial fan-organized initiative celebrating timeline culture across all music, cinema, anime, and pop culture fandoms. We are not affiliated with, endorsed by, or partnered with MTV, Paramount Global, X Corp. (formerly Twitter), Billboard, or any music artists, labels, or agencies. All trademarks, handles, and avatars belong to their respective creators.
