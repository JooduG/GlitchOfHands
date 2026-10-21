/**
 * src/App.tsx
 * 🛸 GLITCHOFHANDS: APPLICATION WORKSPACE SHELL
 *
 * Implements the Card-Table Stage, Collapsible Binder Sidebar, Chat Stream,
 * and Composer with Perchance Text Plugin streaming integration.
 */

import { useState, useRef, useCallback } from "react";
import type { Card } from "./types/card.ts";
import type { ChatMessage } from "./types/chat.ts";
import { stripReply } from "./types/chat.ts";
import { STARTER_CARDS } from "./data/starter-cards.ts";
import { CardTile } from "./components/cards/CardTile.tsx";
import { BoardSlot, EmptySlot } from "./components/cards/BoardSlot.tsx";
import { CardModal } from "./components/cards/CardModal.tsx";
import { MessageFeed } from "./components/chat/MessageFeed.tsx";
import { Composer } from "./components/chat/Composer.tsx";

export function App() {
  const [cards] = useState<Card[]>(STARTER_CARDS);
  const [boardIds, setBoardIds] = useState<string[]>(["Chloe", "Riverside", "CozyDirector"]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      role: "char",
      authorId: "Chloe",
      authorName: "Chloe",
      content:
        "Hey hey! Welcome to Glitch of Hands. Chloe here — tap on my card or add another friend to the board table anytime!",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingSpeaker, setStreamingSpeaker] = useState("");
  const activeStreamRef = useRef<{ stop?: () => void } | null>(null);
  const messageCounterRef = useRef(1);

  // Toggle card on/off board
  const handleToggleBoard = (id: string) => {
    setBoardIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  // Remove card from board
  const handleRemoveFromBoard = (id: string) => {
    setBoardIds((prev) => prev.filter((item) => item !== id));
  };

  // Compute speaker order for characters on the board
  let speakerCounter = 0;
  const boardSlots = boardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is Card => !!c)
    .map((card) => {
      let order = 0;
      if (card.type === "character") {
        speakerCounter++;
        order = speakerCounter;
      }
      return { card, order };
    });

  // Next speaker in rotation
  const charactersOnBoard = boardSlots
    .filter((s) => s.card.type === "character")
    .map((s) => s.card);
  const nextSpeaker = charactersOnBoard.length > 0 ? charactersOnBoard[0] : null;

  // Filtered binder cards
  const filteredCards = cards.filter((card) => {
    const matchesFilter = filterType === "all" || card.type === filterType;
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Turn Generation Routine (Player Send or Banter)
  const executeTurn = useCallback(
    async (userText?: string) => {
      if (isGenerating) return;

      let currentMessages = messages;
      if (userText) {
        messageCounterRef.current += 1;
        const userMsg: ChatMessage = {
          id: `user-${messageCounterRef.current}`,
          role: "user",
          content: userText,
        };
        currentMessages = [...messages, userMsg];
        setMessages(currentMessages);
      }

      const speaker = nextSpeaker;
      const speakerName = speaker ? speaker.name : "Narrator";

      setIsGenerating(true);
      setStreamingText("");
      setStreamingSpeaker(speakerName);

      try {
        const rootApi = typeof window !== "undefined" ? window.root : undefined;

        if (rootApi && rootApi.generateText) {
          // Build instruction context from active cards
          const cardContext = boardSlots
            .map((s) => `[${s.card.type.toUpperCase()}: ${s.card.name}] ${s.card.definition}`)
            .join("\n");
          const recentDialogue = currentMessages
            .slice(-6)
            .map(
              (m) => `${m.authorName || (m.role === "user" ? "You" : "Narrator")}: ${m.content}`,
            )
            .join("\n");

          const instruction = `Story Table Setup:\n${cardContext}\n\nRecent History:\n${recentDialogue}\n\nYou are roleplaying as ${speakerName}. Continue the story in character. Output dialogue and actions naturally.`;

          let accumulated = "";
          const req = (
            rootApi.generateText as (opts: unknown) => Promise<unknown> | { stop?: () => void }
          )({
            instruction,
            onChunk: (chunk: { fullTextSoFar?: string; textChunk?: string }) => {
              accumulated = chunk.fullTextSoFar || accumulated + (chunk.textChunk || "");
              const cleaned = stripReply(accumulated, speakerName);
              setStreamingText(cleaned);
            },
          });

          activeStreamRef.current = req && typeof req === "object" && "stop" in req ? req : null;

          const res = await req;
          const rawText =
            res && typeof res === "object" && "text" in res
              ? String((res as { text: unknown }).text)
              : String(res || accumulated);

          const finalText = stripReply(rawText || accumulated, speakerName);

          if (finalText.trim()) {
            messageCounterRef.current += 1;
            const aiMsg: ChatMessage = {
              id: `ai-${messageCounterRef.current}`,
              role: "char",
              authorId: speaker ? speaker.id : null,
              authorName: speakerName,
              content: finalText,
            };
            setMessages((prev) => [...prev, aiMsg]);
          }
        } else {
          // Local preview simulation if run outside Perchance iframe
          await new Promise((r) => setTimeout(r, 800));
          messageCounterRef.current += 1;
          const aiMsg: ChatMessage = {
            id: `ai-${messageCounterRef.current}`,
            role: "char",
            authorId: speaker ? speaker.id : null,
            authorName: speakerName,
            content: userText
              ? `*Nods thoughtfully at "${userText.slice(0, 30)}..."* It's wonderful having everyone here at the table.`
              : `*Glances across the table with a warm smile.* Shall we see what happens next?`,
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } catch (err) {
        console.warn("Generation stopped or encountered an error", err);
      } finally {
        setIsGenerating(false);
        setStreamingText("");
        setStreamingSpeaker("");
        activeStreamRef.current = null;
      }
    },
    [isGenerating, messages, nextSpeaker, boardSlots],
  );

  const handleStop = () => {
    if (activeStreamRef.current && activeStreamRef.current.stop) {
      activeStreamRef.current.stop();
    }
    setIsGenerating(false);
    setStreamingText("");
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearStory = () => {
    setMessages([]);
  };

  const statusText = `~${messages.length * 45} / 6k · ${boardIds.length} cards · ${messages.length} msgs`;
  const composerPlaceholder = nextSpeaker
    ? `Reply to ${nextSpeaker.name}...`
    : "Play a character to the board...";

  return (
    <div className="fixed inset-0 flex flex-col bg-[#05060a]/90 text-[#f2f7fa] overflow-hidden">
      {/* Top Header */}
      <header className="flex h-14 flex-none items-center justify-between border-b border-[#363840]/60 px-4 md:px-6 backdrop-blur z-20 bg-[#05060a]/40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Toggle Card Binder"
            aria-label="Toggle Card Binder"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#363840] bg-[#191b21] text-[#f2f7fa] hover:bg-[#363840] transition-colors"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#11aecc] shadow-[0_0_12px_rgba(17,174,204,0.6)]" />
            <h1 className="text-base md:text-lg font-bold font-ubuntu tracking-tight text-[#f2f7fa]">
              GlitchOfHands
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#8b93a1] tabular-nums hidden sm:inline-block">
            {boardIds.length}/6 ON BOARD · {cards.length} CARDS
          </span>
          <span className="rounded bg-[#191b21] px-2.5 py-1 text-xs font-mono text-[#11aecc] border border-[#11aecc]/30">
            ⚡ Table Active
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Collapsible Left Sidebar: Binder */}
        <aside
          className={`${
            isSidebarOpen ? "w-80 md:w-96 translate-x-0" : "-translate-x-full w-0"
          } flex flex-col flex-none border-r border-[#363840]/60 bg-[#0b101a]/95 backdrop-blur-xl transition-all duration-200 z-30 overflow-hidden absolute md:relative h-full`}
        >
          {/* Binder Header & Search */}
          <div className="p-4 border-b border-[#363840]/40 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-wider text-[#8b93a1]">
                Card Binder ({filteredCards.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#8b93a1] hover:text-[#f2f7fa] p-1 font-mono text-sm md:hidden"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#363840] bg-[#05060a]/60 px-3 py-1.5 text-xs text-[#f2f7fa] placeholder-[#555d66] focus:border-[#11aecc] focus:outline-none"
            />

            {/* Type Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                "all",
                "character",
                "persona",
                "scenario",
                "location",
                "challenge",
                "director",
                "style",
                "rule",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    filterType === t
                      ? "bg-[#11aecc] text-[#05060a] font-bold"
                      : "bg-[#191b21] text-[#8b93a1] hover:text-[#f2f7fa]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Binder Card List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {filteredCards.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                selected={boardIds.includes(card.id)}
                onToggle={handleToggleBoard}
                onInspect={setInspectedCard}
              />
            ))}
          </div>
        </aside>

        {/* Right Stage: Narrative Feed & Bottom Board + Composer */}
        <main className="flex flex-1 flex-col h-full min-h-0 min-w-0 overflow-hidden relative">
          {/* Chat Scene Feed & Stream (Fills all available height) */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <MessageFeed
              messages={messages}
              streamingText={streamingText}
              streamingSpeaker={streamingSpeaker}
              isGenerating={isGenerating}
              onDeleteMessage={handleDeleteMessage}
            />
          </div>

          {/* Unified Bottom Footer: Board Rack + Composer */}
          <div className="flex-none border-t border-[#363840]/60 bg-[#0b101a]/95 backdrop-blur-xl z-20">
            {/* Horizontal Board Table Rack */}
            <div className="px-3 pt-2.5 pb-1 md:px-5">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {boardSlots.map(({ card, order }) => (
                  <BoardSlot
                    key={card.id}
                    card={card}
                    order={order}
                    onRemove={handleRemoveFromBoard}
                    onInspect={setInspectedCard}
                  />
                ))}

                {boardIds.length < 6 && (
                  <EmptySlot text={`Slot ${boardIds.length + 1} (Empty)`} />
                )}
              </div>
            </div>

            {/* Interactive Composer Bar */}
            <Composer
              placeholder={composerPlaceholder}
              isGenerating={isGenerating}
              statusText={statusText}
              onSend={(text) => executeTurn(text)}
              onBanter={() => executeTurn()}
              onStop={handleStop}
              onClearStory={handleClearStory}
              onToggleBinder={() => setIsSidebarOpen((prev) => !prev)}
            />
          </div>
        </main>
      </div>

      {/* Card Inspector Dialog */}
      <CardModal
        card={inspectedCard}
        isOpen={!!inspectedCard}
        onClose={() => setInspectedCard(null)}
      />
    </div>
  );
}

export default App;

/**
 * CHANGELOG:
 * - 2026-10-21: Fully assembled GlitchOfHands application shell with Board Table rack, Binder, MessageFeed, and Composer.
 */
