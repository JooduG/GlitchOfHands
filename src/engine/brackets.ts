/**
 * src/engine/brackets.ts
 * 🧩 PUBLIC / PRIVATE BRACKET TOOLKIT (pure, no Perchance dependency)
 *
 * `public_state` / `private_state` are multiline `KEY: value` text
 * (semicolons also split lines). Parsed into objects so private maps can
 * be withheld from other speakers with a one-line filter. No regex veils.
 *
 * Port of the main.pjs canonicals (parseBracketLines / getBrackets /
 * bracketLine) so the Vite build is self-sufficient. main.pjs remains
 * canonical for Perchance importers; keep the two in sync.
 */

export type BracketMap = Record<string, string>;

export interface BracketPair {
  public: BracketMap;
  private: BracketMap;
}

export interface BracketedSpecs {
  public_state?: string;
  private_state?: string;
  public?: string;
  private?: string;
  brackets?: unknown;
  [key: string]: string | undefined | unknown;
}

/** Parse `KEY: value` lines (also `KEY = value`, `;`-separated) into a map. */
export function parseBracketLines(text: string | undefined | null): BracketMap {
  const out: BracketMap = {};
  try {
    const parts = String(text || "").split("\n");
    for (const rawLine of parts) {
      const chunks = String(rawLine || "").split(";");
      for (const raw of chunks) {
        const line = String(raw || "").trim();
        if (!line) continue;
        let cut = line.indexOf(":");
        if (cut < 0) cut = line.indexOf("=");
        if (cut < 0) continue;
        const k = line.slice(0, cut).trim();
        const v = line.slice(cut + 1).trim();
        if (k) out[k] = v;
      }
    }
  } catch {
    /* never throws */
  }
  return out;
}

function grabBracketValue(o: unknown): BracketMap {
  if (o === undefined || o === null) return {};
  if (typeof o === "string") return parseBracketLines(o);
  if (typeof o !== "object") return {};
  const r: BracketMap = {};
  for (const k of Object.keys(o as Record<string, unknown>)) {
    r[String(k)] = String((o as Record<string, unknown>)[k]);
  }
  return r;
}

/** Both brackets of a card as objects, reading flat text fields or a nested `specs.brackets` object. */
export function getBrackets(card: { specs?: BracketedSpecs } | null | undefined): BracketPair {
  let pub: BracketMap = {};
  let priv: BracketMap = {};
  try {
    const s: BracketedSpecs = (card && card.specs) || {};
    const nested = s.brackets as
      | { public?: unknown; private?: unknown; PUBLIC?: unknown; PRIVATE?: unknown }
      | undefined;
    if (nested && typeof nested === "object") {
      pub = grabBracketValue(nested.public !== undefined ? nested.public : nested.PUBLIC);
      priv = grabBracketValue(nested.private !== undefined ? nested.private : nested.PRIVATE);
    } else {
      const so = s as Record<string, unknown>;
      pub = parseBracketLines((so["public_state"] as string) || (so["public"] as string) || "");
      priv = parseBracketLines((so["private_state"] as string) || (so["private"] as string) || "");
    }
  } catch {
    /* never throws */
  }
  return { public: pub, private: priv };
}

/** Sorted `KEY: value; KEY: value` rendering. Empty string when no keys. */
export function bracketLine(map: BracketMap | undefined | null): string {
  try {
    const keys = Object.keys(map || {});
    keys.sort();
    return keys.map((k) => `${String(k)}: ${String((map as BracketMap)[k])}`).join("; ");
  } catch {
    return "";
  }
}

/** How many keys a bracket textarea holds (for the live key-count hint). */
export function countBracketKeys(text: string | undefined | null): number {
  try {
    return Object.keys(parseBracketLines(text)).length;
  } catch {
    return 0;
  }
}

/**
 * CHANGELOG:
 * - 2026-10-21: Created from the Perchance workspace bracket toolkit (main.pjs/app.js parity).
 */
