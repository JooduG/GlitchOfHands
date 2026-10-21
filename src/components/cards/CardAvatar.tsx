/**
 * src/components/cards/CardAvatar.tsx
 * 👤 CARD AVATAR COMPONENT
 *
 * Square avatar displaying an image when present, or an initial letter fallback.
 * Converted to pure React TSX from glitchofhand-src/cards/components.js.
 */

import type { Card } from "../../types/card.ts";

interface CardAvatarProps {
  card?: Card | null;
  size?: "sm" | "md" | "lg";
}

function initialOf(name?: string): string {
  return String((name || "?").trim().charAt(0) || "?").toUpperCase();
}

export function CardAvatar({ card, size = "md" }: CardAvatarProps) {
  const img = card?.image;

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-[18px]",
    lg: "w-14 h-14 text-2xl",
  }[size];

  return (
    <div
      className={`${sizeClasses} flex-none rounded-lg flex items-center justify-center overflow-hidden bg-cyan/12 font-ubuntu font-bold leading-none text-frisk border border-gunmetal/40`}
    >
      {img ? (
        <img src={img} alt={card?.name || ""} className="w-full h-full object-cover" />
      ) : (
        <span className="font-ubuntu font-bold text-frisk select-none">
          {initialOf(card?.name)}
        </span>
      )}
    </div>
  );
}

/**
 * CHANGELOG:
 * - 2026-10-21: Converted CardAvatar from glitchofhand-src htm to React 19 TSX.
 */
