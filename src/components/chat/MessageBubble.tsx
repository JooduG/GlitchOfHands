/**
 * src/components/chat/MessageBubble.tsx
 * 💬 CHAT STREAM MESSAGE BUBBLE COMPONENT
 *
 * Renders individual user messages (emerald), companion messages (glass) with
 * collapsible thoughts (<think> details), or system notices with copy/delete actions.
 */

import { useState } from "react";
import type { ChatMessage } from "../../types/chat.ts";
import { parseThoughts } from "../../types/chat.ts";

interface MessageBubbleProps {
  message: ChatMessage;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const { thoughts, visible } = parseThoughts(message.content);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(visible);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (isSystem) {
    return (
      <div className="flex w-full justify-center my-2 animate-[fadeSlideIn_180ms_ease-out]">
        <div className="rounded-lg border border-dashed border-[#555d66] px-4 py-2 font-mono text-xs text-[#8b93a1]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex w-full my-2 animate-[fadeSlideIn_180ms_ease-out] ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex flex-col max-w-[min(85%,640px)] ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Companion Speaker Label */}
        {!isUser && message.authorName && (
          <span className="mb-1 ml-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#11aecc]">
            {message.authorName}
          </span>
        )}

        {/* Collapsible Thoughts (<think>) */}
        {!isUser && thoughts && (
          <details className="mb-2 w-full rounded-lg border border-[#f2f7fa]/10 bg-[#05060a]/40 p-2 text-xs text-[#8b93a1] backdrop-blur">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider select-none hover:text-[#f2f7fa]">
              thoughts
            </summary>
            <div className="mt-1 whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#8b93a1]/90">
              {thoughts}
            </div>
          </details>
        )}

        {/* Main Prose Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-lg ${
            isUser
              ? "bg-[#10b981] text-[#05060a] rounded-br-sm shadow-[0_0_12px_rgba(16,185,129,0.2)] font-normal"
              : "bg-[#363840]/50 text-[#f2f7fa] border border-[#f2f7fa]/10 rounded-bl-sm backdrop-blur-md shadow-[0_8px_32px_rgba(5,6,10,0.5)]"
          }`}
        >
          {visible}
        </div>

        {/* Hover Action Bar */}
        <div className="mt-1 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 px-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded px-1.5 py-0.5 font-mono text-[10px] text-[#555d66] hover:bg-[#363840] hover:text-[#f2f7fa] transition-colors"
          >
            {copied ? "copied" : "copy"}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="rounded px-1.5 py-0.5 font-mono text-[10px] text-[#555d66] hover:bg-[#ef4444]/20 hover:text-[#ef4444] transition-colors"
            >
              delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of MessageBubble with emerald user styling and companion thought collapsibles.
 */
