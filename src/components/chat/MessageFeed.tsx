/**
 * src/components/chat/MessageFeed.tsx
 * 📜 CHAT MESSAGE FEED & AUTO-SCROLL STREAM
 *
 * Displays the scrollable conversation feed, streaming active responses with
 * typing dots indicator, and floating jump-to-bottom anchor.
 */

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../types/chat.ts";
import { MessageBubble } from "./MessageBubble.tsx";

interface MessageFeedProps {
  messages: ChatMessage[];
  streamingText?: string;
  streamingSpeaker?: string;
  isGenerating?: boolean;
  onDeleteMessage?: (id: string) => void;
}

export function MessageFeed({
  messages,
  streamingText,
  streamingSpeaker,
  isGenerating,
  onDeleteMessage,
}: MessageFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  const shouldStickBottom = useRef(true);

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 48;
    shouldStickBottom.current = isAtBottom;
    setShowJumpBtn(!isAtBottom);
  };

  useEffect(() => {
    if (shouldStickBottom.current) {
      scrollToBottom();
    }
  }, [messages, streamingText, isGenerating]);

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-2 scrollbar-thin max-w-4xl w-full mx-auto"
        aria-live="polite"
      >
        {messages.length === 0 && !isGenerating && (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="h-12 w-12 rounded-xl bg-cyan/10 border border-cyan/30 flex items-center justify-center text-2xl mb-3">
              🃏
            </div>
            <p className="font-ubuntu text-sm font-medium text-frisk">The board is ready</p>
            <p className="mt-1 text-xs text-muted max-w-xs">
              Play characters to the board table or type a greeting to start the scene.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onDelete={onDeleteMessage} />
        ))}

        {/* Streaming In-Flight Companion Turn */}
        {isGenerating && (
          <div className="flex w-full my-2 justify-start animate-[fadeSlideIn_180ms_ease-out]">
            <div className="flex flex-col max-w-[min(85%,640px)] items-start">
              {streamingSpeaker && (
                <span className="mb-1 ml-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan">
                  {streamingSpeaker}
                </span>
              )}
              <div className="rounded-2xl px-4 py-3 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-lg bg-gunmetal/50 text-frisk border border-frisk/10 rounded-bl-sm backdrop-blur-md">
                {streamingText ? (
                  streamingText
                ) : (
                  <span className="inline-flex gap-1.5 items-center py-1">
                    <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-cyan animate-pulse [animation-delay:200ms]" />
                    <span className="h-2 w-2 rounded-full bg-cyan animate-pulse [animation-delay:400ms]" />
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Jump to Latest Button */}
      {showJumpBtn && (
        <button
          type="button"
          onClick={() => {
            shouldStickBottom.current = true;
            scrollToBottom();
          }}
          className="absolute bottom-4 right-6 z-10 rounded-full bg-cyan px-3.5 py-1.5 font-ubuntu text-xs font-bold uppercase tracking-wider text-void shadow-[0_0_12px_rgba(17,174,204,0.45)] hover:brightness-110 active:scale-95 transition-all"
        >
          Latest ↓
        </button>
      )}
    </div>
  );
}

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of MessageFeed with streaming preview and jump-to-bottom.
 */
