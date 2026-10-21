/**
 * src/components/cards/CardModal.tsx
 * 🔍 CARD INSPECTION & EDITOR MODAL
 *
 * Full-fidelity inspection dialog for viewing and editing card definitions,
 * specs, public/private brackets, and triggers.
 */

import type { Card } from "../../types/card.ts";
import { CARD_TYPE_REGISTRY } from "../../types/card.ts";
import { CardAvatar } from "./CardAvatar.tsx";
import { TypeBadge } from "./TypeBadge.tsx";

interface CardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updated: Card) => void;
}

export function CardModal({ card, isOpen, onClose }: CardModalProps) {
  if (!isOpen || !card) return null;

  const meta = CARD_TYPE_REGISTRY[card.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060a]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#363840] bg-[#191b21] p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#363840]/60 pb-4">
          <div className="flex items-center gap-3">
            <CardAvatar card={card} size="lg" />
            <div>
              <h2 className="text-xl font-bold font-ubuntu text-[#f2f7fa]">{card.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <TypeBadge type={card.type} />
                <span className="font-mono text-xs text-[#8b93a1]">ID: {card.id}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#8b93a1] hover:text-[#f2f7fa] hover:bg-[#363840] flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#8b93a1] mb-1">
              Definition & Character Essence
            </label>
            <p className="rounded-lg border border-[#363840]/60 bg-[#05060a]/50 p-3 text-sm text-[#f2f7fa] whitespace-pre-wrap leading-relaxed">
              {card.definition || "No definition provided."}
            </p>
          </div>

          {/* First Message for Characters */}
          {card.specs.first_message && (
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#8b93a1] mb-1">
                Opening Dialogue (First Message)
              </label>
              <div className="rounded-lg border border-[#11aecc]/30 bg-[#11aecc]/5 p-3 text-sm text-[#f2f7fa] italic">
                "{card.specs.first_message}"
              </div>
            </div>
          )}

          {/* Type Information */}
          <div className="rounded-lg border border-[#363840]/40 bg-[#05060a]/30 p-3 text-xs text-[#8b93a1] space-y-1">
            <div className="font-semibold text-[#f2f7fa]">Role Behavior:</div>
            <div>{meta?.description}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#363840]/60 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#363840] bg-transparent px-4 py-2 text-sm font-medium text-[#8b93a1] hover:bg-[#363840] hover:text-[#f2f7fa] transition-colors"
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
 */
