/**
 * src/components/cards/BoardSlot.tsx
 * 🎴 BOARD TABLE SLOT COMPONENT
 *
 * Renders one equipped card on the Board Table rack.
 * Features 3px type edge, initial/portrait avatar, speaker rotation order badge,
 * remove button, and discrete ⋯ menu button for inspection.
 */

import type { Card } from "../../types/card.ts";
import { CARD_TYPE_REGISTRY } from "../../types/card.ts";

interface BoardSlotProps {
  card: Card;
  onToggle: (id: string) => void;
  onInspect: (card: Card) => void;
}

function initialOf(name?: string): string {
  return String((name || "?").trim().charAt(0) || "?").toUpperCase();
}

export function BoardSlot({ card, onToggle, onInspect }: BoardSlotProps) {
  const meta = CARD_TYPE_REGISTRY[card.type];
  const typeEdgeColor = meta?.color || "#11aecc";

  return (
    <div
      role="button"
      tabIndex={0}
      title={`${card.name} (${meta?.label || card.type}) — click to return to binder`}
      onClick={() => onToggle(card.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(card.id);
        }
      }}
      className="group relative flex flex-col justify-between w-32 min-h-41 flex-none rounded-xl border border-frisk/10 p-2.5 bg-frisk/5 backdrop-blur-md shadow-[0_8px_24px_rgba(5,6,10,0.35)] hover:border-cyan/60 transition-all text-left"
      style={{ borderTop: `3px solid ${typeEdgeColor}` }}
    >
      {/* Top Bar: Type Dot & Quick Actions (the 3px top edge carries the
          type color; a text pill can't fit 128px without truncating to
          gibberish, so the dot + title carry the label accessibly) */}
      <div className="flex items-center justify-between gap-1 w-full">
        <span
          title={meta?.label || card.type}
          aria-hidden="true"
          className="w-2 h-2 rounded-full flex-none ml-0.5"
          style={{ backgroundColor: typeEdgeColor }}
        />

        <div className="flex items-center gap-0.5 flex-none">
          <button
            type="button"
            title="Inspect"
            aria-label={`Inspect ${card.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onInspect(card);
            }}
            className="w-5 h-5 rounded text-muted hover:text-frisk hover:bg-gunmetal flex items-center justify-center font-mono text-xs transition-colors"
          >
            ⋯
          </button>
        </div>
      </div>

      {/* Middle Portrait / Avatar (washed in the card's type color) */}
      <div
        className="my-1.5 h-14 w-full rounded-lg border border-frisk/5 flex items-center justify-center font-ubuntu font-bold text-2xl text-frisk overflow-hidden"
        style={{ backgroundColor: `${typeEdgeColor}14` }}
      >
        {card.image ? (
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <span className="select-none">{initialOf(card.name)}</span>
        )}
      </div>

      {/* Bottom Row: Name */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs font-semibold text-frisk truncate flex-1">{card.name}</span>
      </div>
    </div>
  );
}

/**
 * CHANGELOG:
 * - 2026-10-21: Converted BoardSlot & EmptySlot to pure TSX with rotation badges & ⋯ menu.
 * - 2026-10-22: Dropped truncating type pill (edge + dot carry type); per-type
 *   avatar wash; body click inspects (role=button is honest now); removed dead
 *   EmptySlot export; removed speaker-order badge + order prop; ✕ removed —
 *   body click returns the card to the binder (mirrors binder toggle).
 */
