CREATE TABLE IF NOT EXISTS public.event_settings (
  id TEXT PRIMARY KEY DEFAULT 'noir_2026_settings',
  event_name TEXT NOT NULL DEFAULT 'Noir Gala ''26',
  tagline TEXT NOT NULL DEFAULT 'ONE TIMELINE. EVERY FANDOM.',
  nominations_open BOOLEAN NOT NULL DEFAULT true,
  voting_open BOOLEAN NOT NULL DEFAULT false,
  voting_deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-12-31 23:59:59+00',
  display_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  winners_published BOOLEAN NOT NULL DEFAULT false,
  reveal_date_display TEXT NOT NULL DEFAULT 'Coming Soon',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.event_settings (id, event_name, tagline, nominations_open, voting_open, winners_published, reveal_date_display)
VALUES ('noir_2026_settings', 'Noir Gala ''26', 'ONE TIMELINE. EVERY FANDOM.', true, false, false, 'Coming Soon')
ON CONFLICT (id) DO NOTHING;
