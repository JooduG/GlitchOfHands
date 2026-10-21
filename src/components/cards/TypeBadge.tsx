/**
 * src/components/cards/TypeBadge.tsx
 * 🏷️ TYPE BADGE COMPONENT
 *
 * Uppercase type pill with a colored dot matching the 8 card types.
 * Converted to pure React TSX from glitchofhand-src/cards/components.js.
 */

import type { CardType } from "../../types/card.ts";
import { CARD_TYPE_REGISTRY } from "../../types/card.ts";

interface TypeBadgeProps {
  type: CardType;
  label?: string;
}

export function TypeBadge({ type, label }: TypeBadgeProps) {
  const meta = CARD_TYPE_REGISTRY[type];
  const displayLabel = label || meta?.label || type;
  const dotColor = meta?.color || "#8b93a1";

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.08em] uppercase px-2 py-0.5 rounded-md bg-void/60 text-muted max-w-full whitespace-nowrap overflow-hidden border border-gunmetal/30">
      <i className="w-1.5 h-1.5 rounded-full flex-none" style={{ backgroundColor: dotColor }} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}

/**
 * CHANGELOG:
 * - 2026-10-21: Converted TypeBadge from glitchofhand-src htm to React 19 TSX.
 */
