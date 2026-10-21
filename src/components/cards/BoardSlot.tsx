/**
 * src/components/cards/BoardSlot.tsx
 * 🎴 BOARD TABLE SLOT COMPONENT
 *
 * Renders one equipped card on the Board Table rack.
 * Features 3px type edge, initial/portrait avatar, speaker rotation order badge,
 * remove button, and discrete ⋯ menu button for inspection.
 */

import type { Card } from '../../types/card.ts'
import { CARD_TYPE_REGISTRY } from '../../types/card.ts'

interface BoardSlotProps {
  card: Card
  order: number // 0 = not speaking, 1..6 = rotation order
  onRemove: (id: string) => void
  onInspect: (card: Card) => void
}

function initialOf(name?: string): string {
  return String((name || '?').trim().charAt(0) || '?').toUpperCase()
}

export function BoardSlot({ card, order, onRemove, onInspect }: BoardSlotProps) {
  const meta = CARD_TYPE_REGISTRY[card.type]
  const typeEdgeColor = meta?.color || '#11aecc'

  return (
    <div
      role="button"
      tabIndex={0}
      title={`${card.name} (${meta?.label || card.type}) — click ⋯ to inspect`}
      className="group relative flex flex-col justify-between w-32 min-h-[164px] flex-none rounded-xl border border-[#f2f7fa]/10 p-2.5 bg-[#f2f7fa]/5 backdrop-blur-md shadow-[0_8px_24px_rgba(5,6,10,0.35)] hover:border-[#11aecc]/60 transition-all text-left"
      style={{ borderTop: `3px solid ${typeEdgeColor}` }}
    >
      {/* Top Bar: Type Pill & Quick Actions */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] font-medium tracking-[0.08em] uppercase px-2 py-0.5 rounded bg-[#05060a]/60 text-[#8b93a1] truncate max-w-[70px]">
          {meta?.label || card.type}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Inspect"
            aria-label={`Inspect ${card.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onInspect(card)
            }}
            className="w-5 h-5 rounded text-[#555d66] hover:text-[#f2f7fa] hover:bg-[#363840] flex items-center justify-center font-mono text-xs transition-colors"
          >
            ⋯
          </button>
          <button
            type="button"
            title="Remove from board"
            aria-label={`Remove ${card.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(card.id)
            }}
            className="w-5 h-5 rounded text-[#555d66] hover:text-[#ef4444] hover:bg-[#363840] flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Middle Portrait / Avatar */}
      <div className="my-1.5 h-14 w-full rounded-lg bg-[rgba(17,174,204,0.08)] border border-[#f2f7fa]/5 flex items-center justify-center font-ubuntu font-bold text-2xl text-[#f2f7fa] overflow-hidden">
        {card.image ? (
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <span className="select-none">{initialOf(card.name)}</span>
        )}
      </div>

      {/* Bottom Row: Name & Speaker Rotation Badge */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs font-semibold text-[#f2f7fa] truncate flex-1">
          {card.name}
        </span>

        {order > 0 && (
          <span
            className="w-5 h-5 rounded-full bg-[#11aecc] text-[#05060a] font-mono text-[11px] font-bold tabular-nums flex items-center justify-center flex-none shadow-[0_0_8px_rgba(17,174,204,0.5)]"
            title={`Speaks #${order} in turn rotation`}
          >
            {order}
          </span>
        )}
      </div>
    </div>
  )
}

export function EmptySlot({ text = '+ Card' }: { text?: string }) {
  return (
    <div className="flex-none w-32 min-h-[164px] border border-dashed border-[#555d66]/50 rounded-xl flex items-center justify-center font-mono text-[11px] tracking-[0.08em] uppercase text-[#555d66] p-3 text-center select-none">
      {text}
    </div>
  )
}

/**
 * CHANGELOG:
 * - 2026-10-21: Converted BoardSlot & EmptySlot to pure TSX with rotation badges & ⋯ menu.
 */
