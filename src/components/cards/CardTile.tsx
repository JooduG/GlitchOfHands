/**
 * src/components/cards/CardTile.tsx
 * 📑 BINDER CARD TILE COMPONENT
 *
 * Renders one card item inside the Binder list.
 * Includes direct equip/unequip toggle and discrete ⋯ menu button for inspection.
 */

import type { Card } from '../../types/card.ts'
import { CardAvatar } from './CardAvatar.tsx'
import { TypeBadge } from './TypeBadge.tsx'

interface CardTileProps {
  card: Card
  selected: boolean
  tagline?: string
  builtin?: boolean
  onToggle: (id: string) => void
  onInspect: (card: Card) => void
}

export function CardTile({
  card,
  selected,
  tagline,
  builtin = false,
  onToggle,
  onInspect,
}: CardTileProps) {
  const displayTagline =
    tagline ||
    card.definition.slice(0, 60) + (card.definition.length > 60 ? '...' : '')

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(card.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle(card.id)
        }
      }}
      className={`group flex items-center gap-3 w-full rounded-lg border p-2 text-left font-inter text-sm cursor-pointer transition-all ${
        selected
          ? 'border-[#11aecc]/60 bg-[#11aecc]/10 shadow-[0_0_12px_rgba(17,174,204,0.15)]'
          : 'border-transparent bg-transparent hover:bg-[#363840]/40 active:scale-[0.98]'
      }`}
    >
      <CardAvatar card={card} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#f2f7fa] truncate">
            {card.name}
          </span>
          {!builtin && (
            <span className="text-[#11aecc] text-xs" title="Custom card">
              •
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <TypeBadge type={card.type} />
        </div>

        <p className="text-xs text-[#8b93a1] truncate mt-1">{displayTagline}</p>
      </div>

      <button
        type="button"
        title="Inspect card details"
        aria-label={`Inspect ${card.name}`}
        onClick={(e) => {
          e.stopPropagation()
          onInspect(card)
        }}
        className="flex-none w-7 h-7 rounded-md border border-transparent bg-transparent text-[#555d66] font-mono text-xs hover:bg-[#363840] hover:text-[#f2f7fa] flex items-center justify-center transition-colors"
      >
        ⋯
      </button>
    </div>
  )
}

/**
 * CHANGELOG:
 * - 2026-10-21: Converted CardTile from glitchofhand-src to TSX with ⋯ inspection button.
 */
