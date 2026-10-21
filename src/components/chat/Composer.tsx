/**
 * src/components/chat/Composer.tsx
 * ✍️ CHAT INPUT COMPOSER & TURN CONTROLLER
 *
 * Implements the auto-resizing input textarea, Banter button, Send button,
 * stop generation button, and options gear menu.
 */

import { useState, useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";

interface ComposerProps {
  placeholder?: string;
  isGenerating?: boolean;
  statusText?: string;
  onSend: (text: string) => void;
  onBanter: () => void;
  onStop?: () => void;
  onClearStory?: () => void;
  onToggleBinder?: () => void;
}

export function Composer({
  placeholder = "Reply to Chloe...",
  isGenerating = false,
  statusText,
  onSend,
  onBanter,
  onStop,
  onClearStory,
  onToggleBinder,
}: ComposerProps) {
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating || !input.trim()) return;
    onSend(input);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <footer className="border-t border-[#363840]/60 bg-[#0b101a]/95 backdrop-blur-xl p-3 md:p-4 z-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Status Line */}
        <div className="flex items-center justify-between px-1 text-[11px] font-mono text-[#8b93a1]">
          <div className="flex items-center gap-2">
            {onToggleBinder && (
              <button
                type="button"
                onClick={onToggleBinder}
                className="rounded border border-[#11aecc]/30 bg-[#11aecc]/10 px-2 py-0.5 text-[#11aecc] hover:bg-[#11aecc]/20 transition-colors"
              >
                Binder
              </button>
            )}
            <span className="tabular-nums truncate max-w-xs sm:max-w-md">
              {statusText || "⚡ Ready to play"}
            </span>
          </div>

          {isGenerating && (
            <span className="flex items-center gap-1.5 text-[#11aecc]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#11aecc] animate-ping" />
              <span>Thinking...</span>
            </span>
          )}
        </div>

        {/* Input Bar Group */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-stretch rounded-xl bg-[#05060a]/80 border border-[#363840] shadow-2xl focus-within:border-[#11aecc] transition-colors"
        >
          {/* Options Gear Menu */}
          <div className="relative flex items-center">
            <button
              type="button"
              title="Story Options"
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex h-full items-center px-3 text-[#8b93a1] hover:text-[#f2f7fa] border-r border-[#363840]/40 transition-colors"
            >
              ⚙
            </button>

            {showMenu && (
              <div className="absolute left-0 bottom-[calc(100%+8px)] w-56 rounded-xl border border-[#363840] bg-[#191b21] p-1.5 shadow-2xl z-50 text-xs font-mono">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#555d66]">
                  Story Controls
                </div>
                {onClearStory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearStory();
                      setShowMenu(false);
                    }}
                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                  >
                    Clear story history
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Message Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={isGenerating}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 resize-none bg-transparent py-3 px-3.5 text-sm md:text-base text-[#f2f7fa] placeholder-[#555d66] focus:outline-none max-h-36 scrollbar-thin"
          />

          {/* Action Buttons: Stop vs Banter & Send */}
          {isGenerating ? (
            <button
              type="button"
              title="Stop Generating"
              onClick={onStop}
              className="flex items-center justify-center bg-[#ef4444] text-[#f2f7fa] px-4 rounded-r-xl hover:brightness-110 active:scale-95 transition-all"
            >
              ■
            </button>
          ) : (
            <div className="flex items-stretch border-l border-[#363840]/40">
              {/* Banter Button: Skip turn */}
              <button
                type="button"
                title="Banter: Next companion speaks"
                onClick={onBanter}
                className="flex items-center justify-center px-3.5 text-[#11aecc] hover:bg-[#11aecc]/10 font-bold transition-colors border-r border-[#363840]/40"
              >
                &gt;
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim()}
                title="Send message"
                className="flex items-center justify-center px-4 rounded-r-xl bg-[#10b981] text-[#05060a] font-black text-lg hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100 transition-all"
              >
                »
              </button>
            </div>
          )}
        </form>
      </div>
    </footer>
  );
}

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of Composer component with Banter, Send, Stop, and Options gear.
 */
