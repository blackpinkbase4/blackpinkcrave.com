"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import {
  getChatMessages,
  addChatMessage,
  broadcastEmojiReaction,
  ChatMessage,
} from "@/lib/chatStore";

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
  speed: number;
}

export const LiveChatReactions: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages());
  const [inputText, setInputText] = useState("");
  const [username, setUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("stan_chat_name") || "";
    }
    return "";
  });
  const [isOpen, setIsOpen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setMessages(getChatMessages());
    };

    const handleRemoteReaction = (e: any) => {
      if (e.detail) {
        triggerReaction(e.detail, false);
      }
    };

    window.addEventListener("noir_chat_updated", handleUpdate);
    window.addEventListener("remote_emoji_reaction", handleRemoteReaction);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("noir_chat_updated", handleUpdate);
      window.removeEventListener("remote_emoji_reaction", handleRemoteReaction);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const triggerReaction = (emoji: string, broadcast = true) => {
    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      emoji,
      left: 15 + Math.random() * 70,
      speed: 2 + Math.random() * 1.5,
    };

    setFloatingReactions((prev) => [...prev.slice(-25), newReaction]);

    if (broadcast) {
      broadcastEmojiReaction(emoji);
    }

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3500);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const senderName = username.trim() || `Stan_${Math.floor(1000 + Math.random() * 9000)}`;
    if (!username.trim() && typeof window !== "undefined") {
      setUsername(senderName);
      localStorage.setItem("stan_chat_name", senderName);
    }

    const added = addChatMessage(senderName, inputText.trim(), false);
    if (added) {
      setMessages(getChatMessages());
    }
    setInputText("");

    if (inputText.includes("👑")) triggerReaction("👑");
    else if (inputText.includes("🏆")) triggerReaction("🏆");
    else if (inputText.includes("🔥")) triggerReaction("🔥");
    else triggerReaction("✨");
  };

  const quickPhrases = ["DESERVED!! 👑", "OMG YESSSS 😭", "CONGRATS!! 🏆", "WE WON 🔥🔥"];

  return (
    <>
      {/* Floating Emojis Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-16 text-3xl sm:text-4xl animate-float-up pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
            style={{
              left: `${r.left}%`,
              animationDuration: `${r.speed}s`,
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Floating Bottom Quick Reaction Bar - Ultra Compact */}
      <div className="fixed bottom-3 sm:bottom-4 right-2 sm:right-4 z-40 flex items-center gap-1.5">
        {/* Quick Reaction Emojis */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/90 border border-amber-400/30 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => triggerReaction("🏆")}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-amber-400/20 text-amber-300 text-sm flex items-center justify-center transition-transform active:scale-125"
            title="Send Trophy"
          >
            🏆
          </button>
          <button
            type="button"
            onClick={() => triggerReaction("👑")}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-amber-400/20 text-amber-300 text-sm flex items-center justify-center transition-transform active:scale-125"
            title="Send Crown"
          >
            👑
          </button>
          <button
            type="button"
            onClick={() => triggerReaction("🔥")}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-rose-500/20 text-rose-400 text-sm flex items-center justify-center transition-transform active:scale-125"
            title="Send Fire"
          >
            🔥
          </button>
          <button
            type="button"
            onClick={() => triggerReaction("😭")}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-sky-400/20 text-sky-400 text-sm flex items-center justify-center transition-transform active:scale-125"
            title="Crying / Happy"
          >
            😭
          </button>
          <button
            type="button"
            onClick={() => triggerReaction("❤️")}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-rose-500/20 text-rose-400 text-sm flex items-center justify-center transition-transform active:scale-125"
            title="Send Love"
          >
            ❤️
          </button>
        </div>

        {/* Live Chat Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-heading font-black text-[10px] sm:text-xs uppercase flex items-center gap-1 shadow-md transition-all active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Chat</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping absolute -top-0.5 -right-0.5" />
        </button>
      </div>

      {/* Docked Live Chat Drawer - Significantly Reduced Size */}
      {isOpen && (
        <div className="fixed bottom-14 sm:bottom-16 right-2 sm:right-4 z-50 w-[82vw] max-w-[270px] flex flex-col rounded-2xl bg-black/95 border border-amber-400/40 backdrop-blur-2xl shadow-2xl overflow-hidden animate-fade-in text-[10px]">
          {/* Chat Header */}
          <div className="p-2 px-3 border-b border-amber-400/20 bg-black/95 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-heading font-black text-xs text-white uppercase tracking-tight">
                Live Chat
              </h4>
              <span className="text-[8px] font-mono text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.2 rounded-full">
                LIVE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 rounded-full text-chrome-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-2 overflow-y-auto space-y-1.5 max-h-[140px] font-mono leading-relaxed">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-1.5 px-2 rounded-xl ${
                  m.isAdmin
                    ? "bg-amber-400/15 border border-amber-400/30 text-amber-200"
                    : "bg-white/5 border border-white/10 text-white"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-chrome-400 mb-0.5">
                  <span className="font-bold flex items-center gap-0.5 text-amber-300 truncate max-w-[140px]">
                    {m.isAdmin && "👑 "}
                    {m.sender}
                  </span>
                  <span className="text-[8px] shrink-0">{m.timestamp}</span>
                </div>
                <p className="text-white break-words text-[10px] leading-snug">{m.text}</p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Phrases */}
          <div className="px-2 py-1 bg-black/60 border-t border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {quickPhrases.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => {
                  setInputText(phrase);
                }}
                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-amber-400/20 text-[9px] font-mono text-amber-200 whitespace-nowrap transition-colors"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-2 border-t border-amber-400/20 bg-black/90 flex gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Cheer..."
              maxLength={140}
              className="flex-1 bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-white placeholder-chrome-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-heading font-black text-[10px] uppercase flex items-center justify-center transition-colors shadow"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
