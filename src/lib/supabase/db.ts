import {
  EventSettings,
  Category,
  Nominee,
  VoteAllocation,
  VoteSubmissionResult,
  VoterBalanceResponse,
  CategoryWinnerResult,
  NomineeResult,
  AuditLog,
} from "@/types";
import { getServerSupabase, isSupabaseConfigured } from "./client";
import { normalizeXUsername } from "../validation";

// The 10 official categories
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "best-fanbase",
    title: "Best Fanbase Account",
    description: "The most dedicated, mobilizing fanbase accounts across all stantwt fandoms.",
    icon: "Users",
    display_order: 1,
    is_active: true,
  },
  {
    id: "best-update",
    title: "Best Update Account",
    description: "The fastest, cleanest, most reliable timeline news breakers.",
    icon: "Bell",
    display_order: 2,
    is_active: true,
  },
  {
    id: "best-voting-streaming",
    title: "Best Voting & Streaming Account",
    description: "Strategic stream drive coordinators and mass voting guides.",
    icon: "TrendingUp",
    display_order: 3,
    is_active: true,
  },
  {
    id: "best-charts",
    title: "Best Charts Account",
    description: "Real-time records, Billboard stats, and chart data curators.",
    icon: "BarChart3",
    display_order: 4,
    is_active: true,
  },
  {
    id: "best-graphics-designer",
    title: "Best Graphics Designer",
    description: "Visual artists designing headers, comeback posters, and layouts.",
    icon: "Palette",
    display_order: 5,
    is_active: true,
  },
  {
    id: "best-video-editor",
    title: "Best Video Editor",
    description: "Virtuoso montage editors, fancams, and cinematic video creators.",
    icon: "Film",
    display_order: 6,
    is_active: true,
  },
  {
    id: "funniest-stan",
    title: "Funniest Stan Account",
    description: "The viral timeline comedians, quote-tweet legends, and meme accounts.",
    icon: "Laugh",
    display_order: 7,
    is_active: true,
  },
  {
    id: "best-new-account",
    title: "Best New Account",
    description: "Breakout timeline voices established within the past year.",
    icon: "Sparkles",
    display_order: 8,
    is_active: true,
  },
  {
    id: "most-iconic-account",
    title: "Most Iconic Account",
    description: "Pillars of Stan Twitter whose iconic viral moments shaped internet culture.",
    icon: "Crown",
    display_order: 9,
    is_active: true,
  },
  {
    id: "peoples-choice",
    title: "People's Choice Award",
    description: "The supreme fan-voted timeline MVP of 2026 across all fandoms.",
    icon: "Flame",
    display_order: 10,
    is_active: true,
  },
];

interface LocalVoteRecord {
  id: string;
  voter_username: string;
  category_id: string;
  nominee_id: string;
  vote_count: number;
  client_ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
}

interface GlobalFallbackState {
  settings: EventSettings;
  categories: Category[];
  nominees: Nominee[];
  votes: LocalVoteRecord[];
  audit_logs: AuditLog[];
}

const defaultFallbackState: GlobalFallbackState = {
  settings: {
    id: "noir_2026_settings",
    event_name: "Noir Gala '26",
    tagline: "ONE TIMELINE. EVERY FANDOM.",
    nominations_open: true,
    nominees_visible: false,
    voting_open: false, // Starts in nomination phase
    voting_deadline: "2026-10-18T23:59:59Z",
    display_timezone: "America/New_York",
    winners_published: false,
    reveal_date_display: "Coming Soon",
    updated_at: new Date().toISOString(),
  },
  categories: [...DEFAULT_CATEGORIES],
  nominees: [],
  votes: [],
  audit_logs: [],
};

const globalStore = globalThis as unknown as {
  __noirFallbackState?: GlobalFallbackState;
};

if (!globalStore.__noirFallbackState) {
  globalStore.__noirFallbackState = defaultFallbackState;
}

const fallbackState = globalStore.__noirFallbackState;

// ==========================================
// 1. EVENT SETTINGS
// ==========================================
let cachedSettings: EventSettings | null = null;
let cachedSettingsExpiry = 0;

export async function getEventSettings(forceFresh = false): Promise<EventSettings> {
  const now = Date.now();
  if (!forceFresh && cachedSettings && now < cachedSettingsExpiry) {
    return cachedSettings;
  }
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("event_settings")
      .select("*")
      .eq("id", "noir_2026_settings")
      .single();

    if (!error && data) {
      const s = data as EventSettings;
      // Parse JSON from reveal_date_display if available
      let meta: {
        nominees_visible?: boolean;
        music_url?: string;
        music_title?: string;
        music_enabled?: boolean;
        cooldown_hours?: number;
        power_hour_active?: boolean;
        ceremony_mode?: "countdown" | "live" | "unlocked";
        countdown_target?: string;
        current_category_index?: number;
        manual_winners?: Record<string, string>;
      } = {};

      try {
        if (s.reveal_date_display && s.reveal_date_display.startsWith("{")) {
          meta = JSON.parse(s.reveal_date_display);
        } else if (s.reveal_date_display === "NOMINEES_VISIBLE:true") {
          meta = { nominees_visible: true };
        }
      } catch {}

      const finalSettings = {
        ...s,
        nominees_visible: s.nominees_visible ?? meta.nominees_visible ?? false,
        music_url: meta.music_url || "",
        music_title: meta.music_title || "",
        music_enabled: meta.music_enabled ?? false,
        cooldown_hours: typeof meta.cooldown_hours === "number" ? meta.cooldown_hours : 3,
        power_hour_active: Boolean(meta.power_hour_active),
        ceremony_mode: meta.ceremony_mode || "countdown",
        countdown_target: meta.countdown_target || "2026-10-31T17:30:00+05:30",
        current_category_index: typeof meta.current_category_index === "number" ? meta.current_category_index : 0,
        manual_winners: meta.manual_winners || {
          "best-fanbase": "nom_1792229360249_cj55i",
          "best-update": "nom_1792226803501_vi7i2",
          "best-voting-streaming": "nom_1792317124691_ywsh6",
          "best-charts": "nom_1792256711633_qeblx",
          "best-graphics-designer": "nom_1792228583980_g8qvp",
          "best-video-editor": "nom_1792228615581_3ij3o",
          "funniest-stan": "nom_1792229283667_qb21s",
          "best-new-account": "nom_1792226723482_q2qdp",
          "most-iconic-account": "nom_1792230173780_cgfrl",
          "peoples-choice": "nom_1792229689031_a3zbv",
          "best-khia-account": "nom_1792230111270_vh77e",
          "best-bts-ender-account": "nom_1792320780502_zluyc"
        },
      };
      cachedSettings = finalSettings;
      cachedSettingsExpiry = now + 1000; // 1 second cache for immediate admin mode sync
      return finalSettings;
    }
  }

  return { ...fallbackState.settings };
}

export async function updateEventSettings(

  updates: Partial<EventSettings>,
  adminIp?: string
): Promise<EventSettings> {
  const supabase = getServerSupabase();
  const timestamp = new Date().toISOString();
  cachedSettings = null;
  cachedSettingsExpiry = 0;

  // Load current settings to preserve existing metadata
  const current = await getEventSettings();

  const meta = {
    nominees_visible: updates.nominees_visible !== undefined ? updates.nominees_visible : (current.nominees_visible ?? false),
    music_url: updates.music_url !== undefined ? updates.music_url : (current.music_url ?? ""),
    music_title: updates.music_title !== undefined ? updates.music_title : (current.music_title ?? ""),
    music_enabled: updates.music_enabled !== undefined ? updates.music_enabled : (current.music_enabled ?? false),
    cooldown_hours: updates.cooldown_hours !== undefined ? updates.cooldown_hours : (current.cooldown_hours ?? 3),
    power_hour_active: updates.power_hour_active !== undefined ? updates.power_hour_active : (current.power_hour_active ?? false),
    ceremony_mode: updates.ceremony_mode !== undefined ? updates.ceremony_mode : (current.ceremony_mode ?? "countdown"),
    countdown_target: updates.countdown_target !== undefined ? updates.countdown_target : (current.countdown_target ?? "2026-10-31T17:30:00+05:30"),
    current_category_index: updates.current_category_index !== undefined ? updates.current_category_index : (current.current_category_index ?? 0),
    manual_winners: updates.manual_winners !== undefined ? updates.manual_winners : (current.manual_winners ?? {}),
  };

  const sanitizedUpdates: Record<string, unknown> = { ...updates };
  sanitizedUpdates.reveal_date_display = JSON.stringify(meta);
  delete sanitizedUpdates.nominees_visible;
  delete sanitizedUpdates.music_url;
  delete sanitizedUpdates.music_title;
  delete sanitizedUpdates.music_enabled;
  delete sanitizedUpdates.cooldown_hours;
  delete sanitizedUpdates.power_hour_active;
  delete sanitizedUpdates.ceremony_mode;
  delete sanitizedUpdates.countdown_target;
  delete sanitizedUpdates.current_category_index;
  delete sanitizedUpdates.manual_winners;

  if (supabase) {
    const { data, error } = await supabase
      .from("event_settings")
      .update({ ...sanitizedUpdates, updated_at: timestamp })
      .eq("id", "noir_2026_settings")
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update settings in Supabase: ${error.message}`);
    }

    await logAuditAction("UPDATE_SETTINGS", updates, adminIp);
    const result = data as EventSettings;
    return {
      ...result,
      nominees_visible: meta.nominees_visible,
      music_url: meta.music_url,
      music_title: meta.music_title,
      music_enabled: meta.music_enabled,
      cooldown_hours: meta.cooldown_hours,
      power_hour_active: meta.power_hour_active,
      ceremony_mode: meta.ceremony_mode,
      countdown_target: meta.countdown_target,
      current_category_index: meta.current_category_index,
      manual_winners: meta.manual_winners,
    };
  }

  fallbackState.settings = {
    ...fallbackState.settings,
    ...updates,
    updated_at: timestamp,
  };
  await logAuditAction("UPDATE_SETTINGS", updates, adminIp);
  return { ...fallbackState.settings };
}

// ==========================================
// 2. CATEGORIES
// ==========================================
export async function getCategories(includeInactive = false): Promise<Category[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    let query = supabase.from("categories").select("*").order("display_order", { ascending: true });
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as Category[];
    }
  }

  return fallbackState.categories
    .filter((c) => includeInactive || c.is_active)
    .sort((a, b) => a.display_order - b.display_order);
}

export async function createCategory(
  cat: {
    id?: string;
    title: string;
    description?: string;
    icon?: string;
    display_order?: number;
    is_active?: boolean;
  },
  adminIp?: string
): Promise<Category> {
  const newCat: Category = {
    id: cat.id || cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: cat.title,
    description: cat.description || "",
    icon: cat.icon || "Trophy",
    display_order: cat.display_order ?? fallbackState.categories.length + 1,
    is_active: cat.is_active ?? true,
    created_at: new Date().toISOString(),
  };

  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("categories").insert([newCat]).select().single();
    if (error) throw new Error(error.message);
    await logAuditAction("CREATE_CATEGORY", { id: newCat.id, title: newCat.title }, adminIp);
    return data as Category;
  }

  fallbackState.categories.push(newCat);
  await logAuditAction("CREATE_CATEGORY", { id: newCat.id, title: newCat.title }, adminIp);
  return newCat;
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>,
  adminIp?: string
): Promise<Category> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logAuditAction("UPDATE_CATEGORY", { id, updates }, adminIp);
    return data as Category;
  }

  const idx = fallbackState.categories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Category not found");
  fallbackState.categories[idx] = { ...fallbackState.categories[idx], ...updates };
  await logAuditAction("UPDATE_CATEGORY", { id, updates }, adminIp);
  return fallbackState.categories[idx];
}

export async function deleteCategory(id: string, adminIp?: string): Promise<boolean> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logAuditAction("DELETE_CATEGORY", { id }, adminIp);
    return true;
  }

  const idx = fallbackState.categories.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  fallbackState.categories.splice(idx, 1);
  fallbackState.nominees = fallbackState.nominees.filter((n) => n.category_id !== id);
  await logAuditAction("DELETE_CATEGORY", { id }, adminIp);
  return true;
}

// ==========================================
// 3. NOMINEES & NOMINATION SUBMISSIONS
// ==========================================
export async function getNominees(
  categoryId?: string,
  onlyFinalists = false,
  includeAvatars = false
): Promise<Nominee[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    // If querying all categories at once (summary/counts), omit heavy avatar_urls unless explicitly requested (e.g. for winners)
    const selectFields = (categoryId || includeAvatars)
      ? "id, category_id, x_username, display_name, avatar_url, is_finalist, created_at"
      : "id, category_id, x_username, display_name, is_finalist, created_at";

    let query = supabase.from("nominees").select(selectFields).order("created_at", { ascending: true });
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (onlyFinalists) {
      query = query.eq("is_finalist", true);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as unknown as Nominee[];
    }
    if (error) {
      console.error("[getNominees] Supabase query error:", error.message);
    }
  }

  return fallbackState.nominees.filter((n) => {
    if (categoryId && n.category_id !== categoryId) return false;
    if (onlyFinalists && !n.is_finalist) return false;
    return true;
  });
}

/**
 * Public community nomination submission
 * Simple: category, handle, display name, profile picture
 */
export async function submitNomination(nominee: {
  category_id: string;
  x_username: string;
  display_name: string;
  avatar_url?: string | null;
}): Promise<Nominee> {
  const settings = await getEventSettings();
  if (!settings.nominations_open) {
    throw new Error("Nomination submissions are currently closed by the admin.");
  }

  const normalizedUser = normalizeXUsername(nominee.x_username);
  if (!normalizedUser) {
    throw new Error("Please enter a valid X username.");
  }

  const newNominee: Nominee = {
    id: `nom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category_id: nominee.category_id,
    x_username: normalizedUser,
    display_name: nominee.display_name.trim(),
    avatar_url: nominee.avatar_url || null,
    is_finalist: false, // Waiting for admin curation / random 8 roll
    created_at: new Date().toISOString(),
  };

  const supabase = getServerSupabase();
  if (supabase) {
    // Only select essential metadata to avoid returning the entire image payload over the wire
    const { data, error } = await supabase
      .from("nominees")
      .insert([newNominee])
      .select("id, category_id, x_username, display_name, created_at, is_finalist")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error(`@${normalizedUser} has already been nominated in this category.`);
      }
      throw new Error(error.message);
    }
    return { ...newNominee, ...data } as Nominee;
  }

  // Fallback
  const exists = fallbackState.nominees.some(
    (n) => n.category_id === newNominee.category_id && n.x_username === newNominee.x_username
  );
  if (exists) {
    throw new Error(`@${newNominee.x_username} has already been nominated in this category.`);
  }

  fallbackState.nominees.push(newNominee);
  return newNominee;
}

/**
 * Admin: Roll Random 8 Finalists for a category
 */
export async function rollRandomFinalists(
  categoryId: string,
  targetCount = 8,
  adminIp?: string
): Promise<Nominee[]> {
  const allCategoryNominees = await getNominees(categoryId, false);
  if (allCategoryNominees.length === 0) {
    throw new Error("No nominations submitted yet for this category to pick from.");
  }

  // Shuffle array using Fisher-Yates
  const shuffled = [...allCategoryNominees];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick top N
  const selected = shuffled.slice(0, targetCount);
  const selectedIds = new Set(selected.map((s) => s.id));

  const supabase = getServerSupabase();
  if (supabase) {
    // Reset all in category to not finalist, then mark selected as finalists
    await supabase.from("nominees").update({ is_finalist: false }).eq("category_id", categoryId);
    await supabase.from("nominees").update({ is_finalist: true }).in("id", Array.from(selectedIds));
    await logAuditAction("ROLL_RANDOM_8", { categoryId, selectedIds: Array.from(selectedIds) }, adminIp);
    return getNominees(categoryId, true);
  }

  // Fallback
  for (const n of fallbackState.nominees) {
    if (n.category_id === categoryId) {
      n.is_finalist = selectedIds.has(n.id);
    }
  }

  await logAuditAction("ROLL_RANDOM_8", { categoryId, count: selected.length }, adminIp);
  return fallbackState.nominees.filter((n) => n.category_id === categoryId && n.is_finalist);
}

/**
 * Admin: Toggle a specific nominee as an approved finalist
 */
export async function toggleFinalistStatus(
  nomineeId: string,
  isFinalist: boolean,
  adminIp?: string
): Promise<Nominee> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("nominees")
      .update({ is_finalist: isFinalist })
      .eq("id", nomineeId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logAuditAction("TOGGLE_FINALIST", { nomineeId, isFinalist }, adminIp);
    return data as Nominee;
  }

  const idx = fallbackState.nominees.findIndex((n) => n.id === nomineeId);
  if (idx === -1) throw new Error("Nominee not found");
  fallbackState.nominees[idx].is_finalist = isFinalist;
  await logAuditAction("TOGGLE_FINALIST", { nomineeId, isFinalist }, adminIp);
  return fallbackState.nominees[idx];
}

/**
 * Admin: Approve All Nominees (mark as finalists)
 * Can be scoped to a single category or across all categories
 */
export async function approveAllNominees(
  categoryId?: string,
  adminIp?: string
): Promise<number> {
  const supabase = getServerSupabase();
  if (supabase) {
    let query = supabase.from("nominees").update({ is_finalist: true });
    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", categoryId);
    } else {
      query = query.neq("id", "none"); // matches all rows
    }
    const { data, error } = await query.select("id");
    if (error) throw new Error(error.message);
    const count = data ? data.length : 0;
    await logAuditAction("APPROVE_ALL_NOMINEES", { categoryId: categoryId || "all", count }, adminIp);
    return count;
  }

  // Fallback
  let count = 0;
  for (const n of fallbackState.nominees) {
    if (!categoryId || categoryId === "all" || n.category_id === categoryId) {
      if (!n.is_finalist) {
        n.is_finalist = true;
        count++;
      }
    }
  }
  await logAuditAction("APPROVE_ALL_NOMINEES", { categoryId: categoryId || "all", count }, adminIp);
  return count;
}

export async function deleteNominee(id: string, adminIp?: string): Promise<boolean> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { error } = await supabase.from("nominees").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logAuditAction("DELETE_NOMINEE", { id }, adminIp);
    return true;
  }

  const idx = fallbackState.nominees.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  fallbackState.nominees.splice(idx, 1);
  fallbackState.votes = fallbackState.votes.filter((v) => v.nominee_id !== id);
  await logAuditAction("DELETE_NOMINEE", { id }, adminIp);
  return true;
}

// ==========================================
// 4. VOTER BALANCE & VOTING LOGIC
// ==========================================
export async function getVoterBalance(
  rawUsername: string,
  categoryId: string
): Promise<VoterBalanceResponse> {
  const username = normalizeXUsername(rawUsername);
  const settings = await getEventSettings();
  const maxCapacity = settings.power_hour_active ? 30 : 10;

  if (!username) {
    return {
      voter_username: "",
      category_id: categoryId,
      votes_used: 0,
      votes_remaining: maxCapacity,
      has_voted: false,
    };
  }

  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase.rpc("get_voter_category_balance", {
      p_voter_username: username,
      p_category_id: categoryId,
    });

    if (!error && data) {
      const remaining = typeof data.votes_remaining === "number" ? (settings.power_hour_active ? Math.max(0, 30 - (data.votes_used || 0)) : data.votes_remaining) : maxCapacity;
      return {
        voter_username: username,
        category_id: categoryId,
        votes_used: data.votes_used ?? 0,
        votes_remaining: remaining,
        has_voted: (data.votes_used ?? 0) > 0,
      };
    }
  }

  const used = fallbackState.votes
    .filter((v) => v.voter_username === username && v.category_id === categoryId)
    .reduce((sum, v) => sum + v.vote_count, 0);

  return {
    voter_username: username,
    category_id: categoryId,
    votes_used: used,
    votes_remaining: Math.max(0, maxCapacity - used),
    has_voted: used > 0,
  };
}

export async function submitVotes(
  rawUsername: string,
  categoryId: string,
  allocations: VoteAllocation[],
  ipHash?: string,
  userAgent?: string
): Promise<VoteSubmissionResult> {
  const username = normalizeXUsername(rawUsername);
  if (!username) {
    return { success: false, error: "Please enter a valid X username." };
  }

  const settings = await getEventSettings();
  if (!settings.voting_open) {
    return { success: false, error: "Voting is currently closed by the admin." };
  }

  const nowUtc = new Date().getTime();
  const deadlineUtc = new Date(settings.voting_deadline).getTime();
  if (nowUtc > deadlineUtc) {
    return { success: false, error: "The voting deadline has passed." };
  }

  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase.rpc("cast_category_votes", {
      p_voter_username: username,
      p_category_id: categoryId,
      p_allocations: allocations,
      p_ip_hash: ipHash || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error,
        remaining_votes: data.remaining_votes,
      };
    }

    return {
      success: true,
      votes_cast: data.votes_cast,
      total_used: data.total_used,
      remaining_votes: data.remaining_votes,
    };
  }

  // Atomic fallback execution - only approved finalists are eligible for votes!
  const finalists = fallbackState.nominees.filter(
    (n) => n.category_id === categoryId && n.is_finalist
  );
  const finalistIds = new Set(finalists.map((n) => n.id));

  let incomingVotes = 0;
  for (const item of allocations) {
    if (!item.nominee_id || !finalistIds.has(item.nominee_id)) {
      return {
        success: false,
        error: "One or more selected nominees are not approved finalists in this category.",
      };
    }
    const units = Math.floor(item.votes);
    if (isNaN(units) || units <= 0) {
      return { success: false, error: "Vote count must be a positive integer." };
    }
    incomingVotes += units;
  }

  const existingVotes = fallbackState.votes
    .filter((v) => v.voter_username === username && v.category_id === categoryId)
    .reduce((sum, v) => sum + v.vote_count, 0);

  if (existingVotes + incomingVotes > 10) {
    const remaining = Math.max(0, 10 - existingVotes);
    return {
      success: false,
      error: `Exceeded 10 vote limit. You tried to cast ${incomingVotes} votes, but only have ${remaining} credits remaining.`,
      remaining_votes: remaining,
    };
  }

  const timestamp = new Date().toISOString();
  cachedSettings = null;
  cachedSettingsExpiry = 0;
  for (const item of allocations) {
    fallbackState.votes.push({
      id: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      voter_username: username,
      category_id: categoryId,
      nominee_id: item.nominee_id,
      vote_count: Math.floor(item.votes),
      client_ip_hash: ipHash || null,
      user_agent: userAgent || null,
      created_at: timestamp,
    });
  }

  const newTotal = existingVotes + incomingVotes;
  return {
    success: true,
    votes_cast: incomingVotes,
    total_used: newTotal,
    remaining_votes: 10 - newTotal,
  };
}

// ==========================================
// 5. RESULTS & WINNERS (EMBARGO PROTECTED)
// ==========================================
export async function getCategoryResults(
  onlyIfPublished = true
): Promise<CategoryWinnerResult[] | null> {
  const settings = await getEventSettings();
  if (onlyIfPublished && !settings.winners_published) {
    return null;
  }

  const categories = await getCategories(true);
  // Fetch lightweight nominee rows first (no avatar payloads) to avoid Supabase statement timeouts
  const allNominees = await getNominees(undefined, false, false);

  let votes: { nominee_id: string; category_id: string; vote_count: number }[] = [];

  const supabase = getServerSupabase();
  if (supabase) {
    // Paginate through all votes in 1000-row chunks to capture all votes beyond 1000 limit
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("votes")
        .select("nominee_id, category_id, vote_count")
        .range(from, from + step - 1);
      if (error || !data || data.length === 0) break;
      votes = votes.concat(data);
      if (data.length < step) break;
      from += step;
    }
  } else {
    votes = fallbackState.votes;
  }

  const voteTallies: Record<string, number> = {};
  for (const v of votes) {
    voteTallies[v.nominee_id] = (voteTallies[v.nominee_id] || 0) + v.vote_count;
  }

  const results: CategoryWinnerResult[] = [];

  for (const cat of categories) {
    let catNominees = allNominees.filter((n) => n.category_id === cat.id && n.is_finalist);
    if (catNominees.length === 0) {
      catNominees = allNominees.filter((n) => n.category_id === cat.id);
    }

    const chosenWinnerId = cat.winner_nominee_id || settings.manual_winners?.[cat.id];
    if (chosenWinnerId) {
      const manualWinner = allNominees.find(
        (n) => n.id === chosenWinnerId || n.x_username.toLowerCase() === chosenWinnerId.toLowerCase().replace(/^@/, "")
      );
      if (manualWinner && !catNominees.some((n) => n.id === manualWinner.id)) {
        catNominees.unshift(manualWinner);
      }
    }

    const categoryTotalVotes = catNominees.reduce(
      (sum, n) => sum + (voteTallies[n.id] || 0),
      0
    );

    const nomineeResults: NomineeResult[] = catNominees
      .map((nom) => {
        const votes = voteTallies[nom.id] || 0;
        const percentage =
          categoryTotalVotes > 0
            ? Math.round((votes / categoryTotalVotes) * 1000) / 10
            : 0;
        return {
          nominee_id: nom.id,
          x_username: nom.x_username,
          display_name: nom.display_name,
          avatar_url: nom.avatar_url,
          votes,
          percentage,
          is_winner: false,
          is_tied: false,
        };
      })
      .sort((a, b) => b.votes - a.votes);

    let winners: NomineeResult[] = [];
    let isTied = false;

    if (chosenWinnerId) {
      // Manual winner selection by Admin!
      const manualWinner = nomineeResults.find(
        (n) => n.nominee_id === chosenWinnerId || n.x_username.toLowerCase() === chosenWinnerId.toLowerCase().replace(/^@/, "")
      );
      if (manualWinner) {
        manualWinner.is_winner = true;
        winners = [manualWinner];
        // Move manualWinner to top (index 0) of nomineeResults
        const others = nomineeResults.filter((n) => n.nominee_id !== manualWinner.nominee_id);
        nomineeResults.length = 0;
        nomineeResults.push(manualWinner, ...others);
      }
    }

    // Bulletproof fallback: ensure EVERY category with nominees crowns a winner
    if (winners.length === 0 && nomineeResults.length > 0) {
      const topVotes = nomineeResults[0].votes;
      if (topVotes > 0) {
        winners = nomineeResults.filter((n) => n.votes === topVotes);
        isTied = winners.length > 1;
        for (const w of nomineeResults) {
          if (w.votes === topVotes) {
            w.is_winner = true;
            w.is_tied = isTied;
          }
        }
      } else {
        // If 0 votes cast yet, crown top finalist so cards and download buttons always appear
        nomineeResults[0].is_winner = true;
        winners = [nomineeResults[0]];
      }
    }

    results.push({
      category_id: cat.id,
      category_title: cat.title,
      total_votes: categoryTotalVotes,
      manual_winner_id: cat.winner_nominee_id || null,
      nominees: nomineeResults,
      winners,
      is_tied: isTied,
    });
  }

  // Efficiently hydrate high-res avatars for ALL finalists and winners
  if (supabase) {
    const neededAvatarIds = Array.from(
      new Set(
        results.flatMap((r) =>
          r.winners
            .map((w) => w.nominee_id)
            .concat(r.nominees.map((n) => n.nominee_id))
        )
      )
    ).filter(Boolean);

    if (neededAvatarIds.length > 0) {
      for (let i = 0; i < neededAvatarIds.length; i += 50) {
        const chunk = neededAvatarIds.slice(i, i + 50);
        const { data: avatarData, error: avatarErr } = await supabase
          .from("nominees")
          .select("id, avatar_url")
          .in("id", chunk);

        if (!avatarErr && avatarData) {
          const avatarMap = new Map(avatarData.map((a) => [a.id, a.avatar_url]));
          for (const r of results) {
            for (const w of r.winners) {
              const url = avatarMap.get(w.nominee_id);
              if (url) w.avatar_url = url;
            }
            for (const n of r.nominees) {
              const url = avatarMap.get(n.nominee_id);
              if (url) n.avatar_url = url;
            }
          }
        }
      }
    }
  }

  // Sanitize all avatar URLs: strip dead 402 storage URLs and non-image Twitter links
  const isValidAvatar = (url?: string | null): boolean => {
    if (!url) return false;
    if (url.includes("dgfwwhvgsejhtvnrttcb.supabase.co")) return false; // Inactive project (402)
    if (url.startsWith("data:image/")) return true; // High-res base64 stored in DB
    if (url.startsWith("http://") || url.startsWith("https://")) {
      if (url.includes("x.com/") || url.includes("twitter.com/")) {
        // Only accept if it's an actual CDN image path like pbs.twimg.com
        return url.includes("pbs.twimg.com") || url.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) !== null;
      }
      return true;
    }
    return false;
  };

  for (const r of results) {
    for (const w of r.winners) {
      if (!isValidAvatar(w.avatar_url)) {
        w.avatar_url = null;
      }
    }
    for (const n of r.nominees) {
      if (!isValidAvatar(n.avatar_url)) {
        n.avatar_url = null;
      }
    }
  }

  return results;
}

// ==========================================
// 6. AUDIT LOGS
// ==========================================
export async function logAuditAction(
  action: string,
  details: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action,
    details,
    performed_by: "admin",
    ip_address: ipAddress || "internal",
    created_at: new Date().toISOString(),
  };

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from("audit_logs").insert([log]);
      return;
    } catch {}
  }

  fallbackState.audit_logs.unshift(log);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) return data as AuditLog[];
  }
  return [...fallbackState.audit_logs];
}

export async function getSuspiciousActivityStats() {
  const votes = fallbackState.votes;
  const ipCounts: Record<string, number> = {};
  const voterCounts: Record<string, number> = {};

  for (const v of votes) {
    if (v.client_ip_hash) {
      ipCounts[v.client_ip_hash] = (ipCounts[v.client_ip_hash] || 0) + 1;
    }
    voterCounts[v.voter_username] = (voterCounts[v.voter_username] || 0) + 1;
  }

  const suspiciousIps = Object.entries(ipCounts)
    .filter(([_, count]) => count > 20)
    .map(([hash, count]) => ({ hash, count }));

  const topActiveVoters = Object.entries(voterCounts)
    .map(([username, count]) => ({ username, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalVoteRecords: votes.length,
    uniqueVoters: Object.keys(voterCounts).length,
    suspiciousIps,
    topActiveVoters,
    burstSpikes: [],
  };
}
