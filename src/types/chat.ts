/**
 * src/types/chat.ts
 * 💬 CHAT STREAM & PROMPT SCHEMAS
 *
 * Single source of truth for Chat Messages, Threads, and Streaming Turn Interfaces.
 */

export type MessageRole = "user" | "char" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string; // May include <think>...</think>
  authorId?: string | null;
  authorName?: string;
  timestamp?: number;
}

export interface ChatThread {
  messages: ChatMessage[];
  summary?: string;
  turn?: number;
}

export interface ParsedThoughts {
  thoughts: string;
  visible: string;
}

/**
 * Splits `<think>...</think>` tags out of raw AI text.
 */
export function parseThoughts(content: string): ParsedThoughts {
  const text = String(content || "");
  const i = text.indexOf("<think>");
  const j = text.indexOf("</think>");
  if (i >= 0 && j > i) {
    return {
      thoughts: text.slice(i + 7, j).trim(),
      visible: (text.slice(0, i) + text.slice(j + 8)).trim(),
    };
  }
  return { thoughts: "", visible: text };
}

/**
 * Strips prefix like "Chloe:" and matching stop sequences from generated text.
 */
export function stripReply(text: string, charName?: string, stops?: string[]): string {
  let t = String(text || "").trim();
  if (charName) {
    const pfx = `${charName}:`;
    if (t.startsWith(pfx)) {
      t = t.slice(pfx.length).trim();
    }
  }
  if (stops) {
    for (const s of stops) {
      const needle = String(s || "").trim();
      if (!needle) continue;
      const idx = t.lastIndexOf(needle);
      if (idx > 0 && idx > t.length - needle.length - 12) {
        t = t.slice(0, idx).trim();
      }
    }
  }
  return t.trim();
}

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of chat stream schemas and parse utilities.
 */
