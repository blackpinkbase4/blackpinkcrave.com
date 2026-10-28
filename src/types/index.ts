export interface EventSettings {
  id: string;
  event_name: string;
  tagline: string;
  nominations_open: boolean;
  nominees_visible?: boolean; // Controls whether public /nominees roster is open
  music_url?: string; // Current ceremony soundtrack URL
  music_title?: string; // Track name / artist
  music_enabled?: boolean; // Whether audio autoplay is active
  cooldown_hours?: number; // Voting cooldown window: 1, 3, 6, 12, or 24 hours
  power_hour_active?: boolean; // When true, boosts allowance to 30 votes per category
  voting_open: boolean;
  voting_deadline: string;
  display_timezone: string;
  winners_published: boolean;
  reveal_date_display: string;
  ceremony_mode?: "countdown" | "live" | "unlocked";
  countdown_target?: string;
  current_category_index?: number;
  manual_winners?: Record<string, string>;
  updated_at?: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  winner_nominee_id?: string | null;
  nominee_count?: number;
  created_at?: string;
}

export interface Nominee {
  id: string;
  category_id: string;
  x_username: string; // Normalized (lowercase, no @)
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_finalist: boolean; // Approved for the Top 8 ballot
  created_at?: string;
}

export interface VoteAllocation {
  nominee_id: string;
  votes: number; // 1-10
}

export interface VoteSubmissionRequest {
  voter_username: string;
  category_id: string;
  allocations: VoteAllocation[];
  captcha_token?: string;
  device_id?: string;
}

export interface VoteSubmissionResult {
  success: boolean;
  error?: string;
  votes_cast?: number;
  total_used?: number;
  remaining_votes?: number;
}

export interface VoterBalanceResponse {
  voter_username: string;
  category_id: string;
  votes_used: number;
  votes_remaining: number;
  has_voted: boolean;
}

export interface NomineeResult {
  nominee_id: string;
  x_username: string;
  display_name: string;
  avatar_url?: string | null;
  votes: number;
  percentage: number;
  is_winner: boolean;
  is_tied: boolean;
}

export interface CategoryWinnerResult {
  category_id: string;
  category_title: string;
  total_votes: number;
  manual_winner_id?: string | null;
  nominees: NomineeResult[];
  winners: NomineeResult[];
  is_tied: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  performed_by: string;
  ip_address?: string;
  created_at: string;
}
