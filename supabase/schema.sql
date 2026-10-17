-- ==============================================================================
-- NOIR STAN AWARDS '26 — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- "ONE TIMELINE. EVERY FANDOM."
-- Execute this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP TABLES IF EXIST (Order respects foreign key relationships)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS nominees CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS event_settings CASCADE;

-- 3. EVENT SETTINGS TABLE
CREATE TABLE event_settings (
  id TEXT PRIMARY KEY DEFAULT 'noir_2026_settings',
  event_name TEXT NOT NULL DEFAULT 'Noir Stan Awards ''26',
  tagline TEXT NOT NULL DEFAULT 'ONE TIMELINE. EVERY FANDOM.',
  nominations_open BOOLEAN NOT NULL DEFAULT true,
  voting_open BOOLEAN NOT NULL DEFAULT false,
  voting_deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-12-31 23:59:59+00',
  display_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  winners_published BOOLEAN NOT NULL DEFAULT false,
  reveal_date_display TEXT NOT NULL DEFAULT 'Coming Soon',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CATEGORIES TABLE
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Trophy',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  winner_nominee_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_categories_order ON categories (display_order ASC);
CREATE INDEX idx_categories_active ON categories (is_active);

-- 5. NOMINEES TABLE
CREATE TABLE nominees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  x_username TEXT NOT NULL, -- Normalized: lowercase, no leading @
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_finalist BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_nominee_per_category UNIQUE(category_id, x_username)
);

CREATE INDEX idx_nominees_category ON nominees (category_id);
CREATE INDEX idx_nominees_active ON nominees (is_active);
CREATE INDEX idx_nominees_username ON nominees (x_username);

-- 6. VOTES TABLE
-- Stores normalized allocations (1 to 10 credits) atomically linked to voter and category
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_username TEXT NOT NULL, -- Normalized: lowercase, no leading @
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL REFERENCES nominees(id) ON DELETE CASCADE,
  vote_count INTEGER NOT NULL CHECK (vote_count > 0 AND vote_count <= 10),
  client_ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_votes_voter_category ON votes (voter_username, category_id);
CREATE INDEX idx_votes_category_nominee ON votes (category_id, nominee_id);
CREATE INDEX idx_votes_created_at ON votes (created_at DESC);
CREATE INDEX idx_votes_ip_hash ON votes (client_ip_hash);

-- 7. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  performed_by TEXT NOT NULL DEFAULT 'admin',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- EVENT SETTINGS: Public can read settings
CREATE POLICY "Public can view event settings" 
  ON event_settings FOR SELECT 
  TO public 
  USING (true);

-- CATEGORIES: Public can read active categories
CREATE POLICY "Public can view active categories" 
  ON categories FOR SELECT 
  TO public 
  USING (is_active = true);

-- NOMINEES: Public can read active nominees
CREATE POLICY "Public can view active nominees" 
  ON nominees FOR SELECT 
  TO public 
  USING (is_active = true);

-- VOTES: Public CANNOT select, insert, update or delete raw votes directly.
-- All voting operations must pass through the atomic stored procedure or trusted backend server-role client!
-- No policies granted to public or anon.

-- AUDIT LOGS: Admin/Service role only.

-- ==============================================================================
-- 9. ATOMIC STORED FUNCTION: SUBMIT CATEGORY VOTES
-- Enforces:
--   1. Voting is currently open in event_settings
--   2. Current UTC timestamp <= voting_deadline
--   3. Serializes submissions for the same (voter_username, category_id) using pg_advisory_xact_lock
--   4. Checks existing sum of votes for (voter_username, category_id)
--   5. Verifies all nominated accounts exist, belong to this category, and are active
--   6. Enforces total existing + new votes <= 10
--   7. Inserts records atomically in a transaction
-- ==============================================================================
CREATE OR REPLACE FUNCTION submit_category_votes(
  p_voter_username TEXT,
  p_category_id TEXT,
  p_allocations JSONB, -- Array of {"nominee_id": "...", "votes": 3}
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_normalized_user TEXT;
  v_existing_votes INTEGER;
  v_new_votes INTEGER := 0;
  v_item JSONB;
  v_nominee_id TEXT;
  v_units INTEGER;
  v_nominee_exists BOOLEAN;
  v_lock_key BIGINT;
BEGIN
  -- Normalize username: strip whitespace, remove leading '@', lower-case
  v_normalized_user := lower(trim(p_voter_username));
  IF substring(v_normalized_user FROM 1 FOR 1) = '@' THEN
    v_normalized_user := substring(v_normalized_user FROM 2);
  END IF;

  IF length(v_normalized_user) = 0 OR length(v_normalized_user) > 50 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid X username format.');
  END IF;

  -- 1. Check Event Settings
  SELECT * INTO v_settings FROM event_settings WHERE id = 'noir_2026_settings' LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event configuration not found.');
  END IF;

  IF NOT v_settings.voting_open THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting is currently closed by the organizer.');
  END IF;

  IF timezone('utc'::text, now()) > v_settings.voting_deadline THEN
    RETURN jsonb_build_object('success', false, 'error', 'The voting deadline has passed.');
  END IF;

  -- 2. Validate category exists and is active
  IF NOT EXISTS (SELECT 1 FROM categories WHERE id = p_category_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Category not found or inactive.');
  END IF;

  -- 3. Obtain transaction-level advisory lock on (voter_username, category_id)
  -- This guarantees race conditions are impossible even under concurrent burst attacks
  v_lock_key := ('x' || substr(md5(v_normalized_user || ':' || p_category_id), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 4. Calculate existing votes in this category
  SELECT COALESCE(SUM(vote_count), 0) INTO v_existing_votes
  FROM votes
  WHERE voter_username = v_normalized_user AND category_id = p_category_id;

  IF v_existing_votes >= 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already used all 10 vote credits for this category.',
      'remaining_votes', 0
    );
  END IF;

  -- 5. Validate allocations array
  IF jsonb_array_length(p_allocations) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No vote allocations submitted.');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_allocations)
  LOOP
    v_nominee_id := v_item->>'nominee_id';
    v_units := (v_item->>'votes')::INTEGER;

    IF v_units IS NULL OR v_units <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Each vote allocation must be at least 1 credit.');
    END IF;

    -- Validate nominee belongs to category and is active finalist
    SELECT EXISTS (
      SELECT 1 FROM nominees 
      WHERE id = v_nominee_id 
        AND category_id = p_category_id 
        AND is_active = true
        AND is_finalist = true
    ) INTO v_nominee_exists;

    IF NOT v_nominee_exists THEN
      RETURN jsonb_build_object('success', false, 'error', 'One or more selected nominees are invalid or not approved finalists in this category.');
    END IF;

    v_new_votes := v_new_votes + v_units;
  END LOOP;

  -- 6. Enforce 10-vote hard ceiling
  IF (v_existing_votes + v_new_votes) > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Exceeded 10 vote limit. You tried to cast %s votes, but only have %s credits remaining.', v_new_votes, 10 - v_existing_votes),
      'remaining_votes', 10 - v_existing_votes
    );
  END IF;

  -- 7. Insert votes atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_allocations)
  LOOP
    v_nominee_id := v_item->>'nominee_id';
    v_units := (v_item->>'votes')::INTEGER;

    INSERT INTO votes (voter_username, category_id, nominee_id, vote_count, client_ip_hash, user_agent)
    VALUES (v_normalized_user, p_category_id, v_nominee_id, v_units, p_ip_hash, p_user_agent);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'votes_cast', v_new_votes,
    'total_used', v_existing_votes + v_new_votes,
    'remaining_votes', 10 - (v_existing_votes + v_new_votes)
  );
END;
$$;

-- ==============================================================================
-- 10. HELPER FUNCTION: GET VOTER REMAINING CREDITS
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_voter_category_balance(
  p_voter_username TEXT,
  p_category_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized_user TEXT;
  v_existing_votes INTEGER;
BEGIN
  v_normalized_user := lower(trim(p_voter_username));
  IF substring(v_normalized_user FROM 1 FOR 1) = '@' THEN
    v_normalized_user := substring(v_normalized_user FROM 2);
  END IF;

  SELECT COALESCE(SUM(vote_count), 0) INTO v_existing_votes
  FROM votes
  WHERE voter_username = v_normalized_user AND category_id = p_category_id;

  RETURN jsonb_build_object(
    'voter_username', v_normalized_user,
    'category_id', p_category_id,
    'votes_used', v_existing_votes,
    'votes_remaining', GREATEST(0, 10 - v_existing_votes)
  );
END;
$$;

-- ==============================================================================
-- 11. SEED DEFAULT DATA
-- ==============================================================================
INSERT INTO event_settings (id, event_name, tagline, nominations_open, voting_open, display_timezone, winners_published, reveal_date_display)
VALUES (
  'noir_2026_settings',
  'Noir Stan Awards ''26',
  'ONE TIMELINE. EVERY FANDOM.',
  true,
  false,
  'America/New_York',
  false,
  'Coming Soon'
)
ON CONFLICT (id) DO NOTHING;

-- Seed the 10 official categories
INSERT INTO categories (id, title, description, icon, display_order, is_active)
VALUES
  ('best-fanbase', 'Best Fanbase Account', 'Honoring the most dedicated, community-unifying, and impactful fanbase accounts across all stantwt fandoms.', 'Users', 1, true),
  ('best-update', 'Best Update Account', 'The fastest, cleanest, and most reliable timeline update accounts breaking real-time news.', 'Bell', 2, true),
  ('best-voting-streaming', 'Best Voting & Streaming Account', 'Strategic coordinators powering stream drives, digital voting tutorials, and timeline mobilization.', 'TrendingUp', 3, true),
  ('best-charts', 'Best Charts Account', 'Accurate, beautiful data trackers archiving streaming records, Billboard stats, and chart achievements.', 'BarChart3', 4, true),
  ('best-graphics-designer', 'Best Graphics Designer', 'Visual maestros designing stunning banners, comeback layouts, headers, and creative assets.', 'Palette', 5, true),
  ('best-video-editor', 'Best Video Editor', 'Cinephiles and montage virtuosos crafting breathtaking timeline edits, fancams, and cinematic reels.', 'Film', 6, true),
  ('funniest-stan', 'Funniest Stan Account', 'The timeline legends whose viral quotes, humor, reaction clips, and unhinged memes fuel stantwt laughter.', 'Laugh', 7, true),
  ('best-new-account', 'Best New Account', 'Breakout timeline voices established within the past year who rapidly redefined stan discourse.', 'Sparkles', 8, true),
  ('most-iconic-account', 'Most Iconic Account', 'Pillars of stan culture whose historical tweets, viral moments, and longevity shaped Twitter folklore.', 'Crown', 9, true),
  ('peoples-choice', 'People''s Choice Award', 'The ultimate fan-voted supreme accolade honoring Stan Twitter''s undisputed MVP of 2026.', 'Flame', 10, true)
ON CONFLICT (id) DO NOTHING;
