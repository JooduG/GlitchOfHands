/**
 * src/components/cards/BoardSlot.tsx
 * 🎴 BOARD TABLE SLOT COMPONENT
 *
 * Renders one equipped card on the Board Table rack.
 * Features 3px top type edge, initial/portrait avatar, inspect button.
 */

import type { Card } from "../../types/card.ts";
import { CARD_TYPE_REGISTRY } from "../../types/card.ts";

interface BoardSlotProps {
  card: Card;
  onToggle: (id: string) => void;
  onInspect: (card: Card) => void;
  fluid?: boolean; // fill the grid cell (binder) instead of fixed w-32 (rack)
  selected?: boolean; // equipped glow (binder grid; rack cards are all equipped)
}

function initialOf(name?: string): string {
  return String((name || "?").trim().charAt(0) || "?").toUpperCase();
}

export function BoardSlot({ card, onToggle, onInspect, fluid = false, selected = false }: BoardSlotProps) {
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
      className={`group relative flex flex-col justify-between ${fluid ? "w-full min-w-0" : "w-32 flex-none"} min-h-41 rounded-xl border p-2.5 backdrop-blur-md shadow-[0_8px_24px_rgba(5,6,10,0.35)] transition-all text-left cursor-pointer ${
        selected
          ? "border-cyan/60 bg-cyan/10 shadow-[0_0_12px_rgba(17,174,204,0.25)]"
          : "border-frisk/10 bg-frisk/5 hover:border-frisk/25"
      }`}
      style={{ borderTop: `3px solid ${typeEdgeColor}` }}
    >
      {/* Top: Name (type lives on the top edge) */}
      <div className="flex items-center gap-1 w-full">
        <span className="text-xs font-semibold text-frisk truncate flex-1">{card.name}</span>
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

      {/* Bottom Right: Inspect, tinted in the card's type color */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          title="Inspect"
          aria-label={`Inspect ${card.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onInspect(card);
          }}
          style={{ color: typeEdgeColor }}
          className="w-5 h-5 rounded hover:bg-gunmetal hover:brightness-125 flex items-center justify-center font-mono text-xs transition-colors"
        >
          ⋯
        </button>
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
 * - 2026-10-22: Type edge moved top -> left; name moved bottom -> top;
 *   type dot removed; ⋯ moved bottom-right, tinted in the type color.
 * - 2026-10-22: cursor-pointer on hover; type edge moved back left -> top.
 */
