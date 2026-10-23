/**
 * src/components/cards/CardModal.tsx
 * 🔍 CARD INSPECTION & EDIT ENTRY MODAL
 *
 * Read-only inspection: avatar, definition, opening line,
 * role behavior. Optional `onEdit` adds the "Edit card" jump
 * into the full editor (board ⋯ buttons and binder rows use this).
 */

import type { Card } from "../../types/card.ts";
import { CARD_TYPE_REGISTRY } from "../../types/card.ts";
import { CardAvatar } from "./CardAvatar.tsx";
import { TypeBadge } from "./TypeBadge.tsx";

interface CardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (card: Card) => void;
}

export function CardModal({ card, isOpen, onClose, onEdit }: CardModalProps) {
  if (!isOpen || !card) return null;

  const meta = CARD_TYPE_REGISTRY[card.type];
  const firstMessage = (card.specs && (card.specs.first_message || card.specs.greeting)) || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-gunmetal bg-chalk p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gunmetal/60 pb-4">
          <div className="flex items-center gap-3">
            <CardAvatar card={card} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-frisk">{card.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <TypeBadge type={card.type} />
                <span className="font-mono text-xs text-muted">ID: {card.id}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="w-8 h-8 rounded-lg text-muted hover:text-frisk hover:bg-gunmetal flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
              Definition &amp; Character Essence
            </label>
            <p className="rounded-lg border border-gunmetal/60 bg-void/50 p-3 text-sm text-frisk whitespace-pre-wrap leading-relaxed">
              {card.definition || "No definition provided."}
            </p>
          </div>

          {firstMessage && (
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
                Opening Dialogue (First Message)
              </label>
              <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3 text-sm text-frisk italic">
                &ldquo;{firstMessage}&rdquo;
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gunmetal/40 bg-void/30 p-3 text-xs text-muted space-y-1">
            <div className="font-semibold text-frisk">Role Behavior:</div>
            <div>{meta?.description}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-gunmetal/60 pt-4">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(card)}
              className="rounded-lg bg-emerald px-4 py-2 text-sm font-bold text-void hover:brightness-110 transition"
            >
              Edit card
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gunmetal px-4 py-2 text-sm font-medium text-muted hover:bg-gunmetal hover:text-frisk transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of CardModal inspection view.
 * - 2026-10-21: Added public/private bracket display, optional onEdit entry, backdrop-click close.
 */
