export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isAdmin?: boolean;
  isGold?: boolean;
}

export interface CeremonyState {
  mode: "countdown" | "live" | "ended" | "unlocked";
  countdownTarget: string; // ISO string e.g. 2026-10-31T17:30:00+05:30
  currentCategoryIndex: number;
  unlockFullResults: boolean;
}

const CHAT_STORAGE_KEY = "noir_live_chat_messages";
const BANNED_STORAGE_KEY = "noir_banned_handles";
const CEREMONY_STORAGE_KEY = "noir_ceremony_state";

export const DEFAULT_CEREMONY_TARGET = "2026-10-31T17:30:00+05:30";

export const DEFAULT_CEREMONY_STATE: CeremonyState = {
  mode: "countdown",
  countdownTarget: DEFAULT_CEREMONY_TARGET,
  currentCategoryIndex: 0,
  unlockFullResults: false,
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "NoirOfficial",
    text: "🏆 Welcome to NOIR GALA '26! Live Premiere countdown is active.",
    timestamp: "5:00 PM",
    isAdmin: true,
    isGold: true,
  },
  {
    id: "m-2",
    sender: "StanTimeline",
    text: "SO HYPED FOR THIS REVEAL!! 🔥👑",
    timestamp: "5:01 PM",
    isGold: true,
  },
  {
    id: "m-3",
    sender: "PopCultureHub",
    text: "20 categories, record-breaking votes. Who takes home 1st place? ✨",
    timestamp: "5:02 PM",
  },
];

// Browser Broadcast Channel for instant, clean multi-tab sync with 0 WebSocket errors
const broadcastChannel =
  typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined"
    ? new BroadcastChannel("noir-ceremony-live-channel")
    : null;

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === "new-message" && data.payload) {
      const banned = getBannedHandles();
      if (!banned.includes(data.payload.sender?.toLowerCase())) {
        const current = getChatMessages();
        if (!current.some((m) => m.id === data.payload.id)) {
          saveChatMessages([...current.slice(-60), data.payload], false);
        }
      }
    } else if (data.type === "emoji-reaction" && data.payload?.emoji) {
      window.dispatchEvent(new CustomEvent("remote_emoji_reaction", { detail: data.payload.emoji }));
    } else if (data.type === "ceremony-state-update" && data.payload) {
      saveCeremonyState(data.payload, false);
    }
  };
}

export function getBannedHandles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BANNED_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function banHandle(handle: string) {
  const clean = handle.replace(/^@/, "").trim().toLowerCase();
  if (!clean) return;
  const list = getBannedHandles();
  if (!list.includes(clean)) {
    list.push(clean);
    try {
      localStorage.setItem(BANNED_STORAGE_KEY, JSON.stringify(list));
      const msgs = getChatMessages().filter((m) => m.sender.toLowerCase() !== clean);
      saveChatMessages(msgs);
      window.dispatchEvent(new CustomEvent("noir_chat_updated"));
    } catch {}

    broadcastChannel?.postMessage({
      type: "ban-user",
      payload: { handle: clean },
    });
  }
}

export function getChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return INITIAL_MESSAGES;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed: ChatMessage[] = JSON.parse(raw);
      const banned = getBannedHandles();
      return parsed.filter((m) => !banned.includes(m.sender.toLowerCase()));
    }
  } catch {}
  return INITIAL_MESSAGES;
}

export function saveChatMessages(messages: ChatMessage[], broadcast = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent("noir_chat_updated", { detail: messages }));
  } catch {}

  if (broadcast) {
    broadcastChannel?.postMessage({
      type: "sync-messages",
      payload: messages,
    });
  }
}

export function addChatMessage(sender: string, text: string, isAdmin = false): ChatMessage | null {
  const cleanSender = sender.replace(/^@/, "").trim() || "Stan";
  const banned = getBannedHandles();
  if (banned.includes(cleanSender.toLowerCase())) {
    return null;
  }

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender: cleanSender,
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isAdmin,
    isGold: isAdmin,
  };

  const current = getChatMessages();
  const updated = [...current.slice(-60), newMsg];
  saveChatMessages(updated, false);

  broadcastChannel?.postMessage({
    type: "new-message",
    payload: newMsg,
  });

  return newMsg;
}

export function deleteChatMessage(id: string) {
  const current = getChatMessages();
  const updated = current.filter((m) => m.id !== id);
  saveChatMessages(updated);
}

export function clearAllChatMessages() {
  saveChatMessages([]);
}

export function broadcastEmojiReaction(emoji: string) {
  broadcastChannel?.postMessage({
    type: "emoji-reaction",
    payload: { emoji },
  });
}

export function getCeremonyState(): CeremonyState {
  if (typeof window === "undefined") return DEFAULT_CEREMONY_STATE;
  try {
    const raw = localStorage.getItem(CEREMONY_STORAGE_KEY);
    if (raw) return { ...DEFAULT_CEREMONY_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CEREMONY_STATE;
}

export function saveCeremonyState(state: CeremonyState, broadcast = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CEREMONY_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("noir_ceremony_state_changed", { detail: state }));
  } catch {}

  if (broadcast) {
    broadcastChannel?.postMessage({
      type: "ceremony-state-update",
      payload: state,
    });
  }
}
