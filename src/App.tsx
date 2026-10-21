/**
 * src/App.tsx
 * 🛸 GLITCHOFHANDS: APPLICATION WORKSPACE SHELL
 *
 * Implements the Card-Table Stage, Collapsible Binder Sidebar, and Chat Feed.
 */

import { useState } from "react";
import type { Card } from "./types/card.ts";
import { STARTER_CARDS } from "./data/starter-cards.ts";
import { CardTile } from "./components/cards/CardTile.tsx";
import { BoardSlot, EmptySlot } from "./components/cards/BoardSlot.tsx";
import { CardModal } from "./components/cards/CardModal.tsx";

export function App() {
  const [cards] = useState<Card[]>(STARTER_CARDS);
  const [boardIds, setBoardIds] = useState<string[]>(["Chloe", "Riverside", "CozyDirector"]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filtered binder cards
  const filteredCards = cards.filter((card) => {
    const matchesFilter = filterType === "all" || card.type === filterType;
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-screen w-full flex-col bg-[#05060a]/90 text-[#f2f7fa] overflow-hidden">
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
          } flex flex-col flex-none border-r border-[#363840]/60 bg-[#0b101a]/95 backdrop-blur-xl transition-all duration-200 z-10 overflow-hidden`}
        >
          {/* Binder Header & Search */}
          <div className="p-4 border-b border-[#363840]/40 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-wider text-[#8b93a1]">
                Card Binder ({filteredCards.length})
              </h2>
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
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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

        {/* Right Stage: Board Table & Chat Scene */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Horizontal Board Table Rack */}
          <section className="flex-none border-b border-[#363840]/60 bg-[#05060a]/60 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-[#8b93a1]">
                Table Cast & Active Hand
              </span>
              <span className="font-mono text-xs text-[#555d66]">
                Click card to pick up / put down
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {boardSlots.map(({ card, order }) => (
                <BoardSlot
                  key={card.id}
                  card={card}
                  order={order}
                  onRemove={handleRemoveFromBoard}
                  onInspect={setInspectedCard}
                />
              ))}

              {boardIds.length < 6 && <EmptySlot text={`Slot ${boardIds.length + 1} (Empty)`} />}
            </div>
          </section>

          {/* Chat Scene Feed Wireframe */}
          <section className="flex flex-1 flex-col overflow-hidden p-6">
            <div className="flex flex-1 flex-col justify-center items-center rounded-2xl border border-dashed border-[#363840] bg-[#0b101a]/30 p-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-[#11aecc]/10 border border-[#11aecc]/40 flex items-center justify-center text-xl mb-3">
                💬
              </div>
              <h3 className="font-ubuntu text-base font-medium text-[#f2f7fa]">
                Scene Stage Door Ready
              </h3>
              <p className="mt-1 max-w-sm text-xs text-[#8b93a1]">
                Equip speaking characters to the board to begin automated rotation or interactive
                chat.
              </p>
            </div>
          </section>
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
 * - 2026-10-21: Assembled GlitchOfHands application shell with Board Table rack and Binder sidebar.
 */
