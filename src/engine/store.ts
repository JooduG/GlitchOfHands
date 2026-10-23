/**
 * src/engine/store.ts
 * 🗂️ CARD / THREAD / TABLE PERSISTENCE + SHARE / IMPORT / EXPORT
 *
 * Same data contract as the Perchance app (kv folder `chatV1`, keys
 * `cards`/`threads`/`table`/`tableThreads`/`activeCharId`/`hiddenStarters`,
 * export backup v3, `#card=` share links). Customs are sanitized on load;
 * starters come from STARTER_CARDS minus hidden ids.
 */

import type { Card, CardType } from "../types/card.ts";
import { CARD_TYPE_REGISTRY } from "../types/card.ts";
import { STARTER_CARDS } from "../data/starter-cards.ts";
import type { Msg } from "./prompts.ts";
import { getStarterCards, storeGet, storeSet } from "./perchance.ts";

export type { Msg };

export interface TableThread {
  messages: Msg[];
  summary: string;
  turn: number;
}

export interface LegacyThread {
  messages: Msg[];
  summary: string;
  deck: string[];
}

export interface PersistState {
  starters: Card[];
  customs: Card[];
  hiddenStarters: string[];
  threads: Record<string, LegacyThread>;
  table: string[];
  tableThreads: Record<string, TableThread>;
  activeCharId: string | null;
  userName: string;
}

const KNOWN_TYPES: CardType[] = [
  "character",
  "persona",
  "scenario",
  "location",
  "challenge",
  "director",
  "style",
  "rule",
];

export function isKnownType(t: unknown): t is CardType {
  return typeof t === "string" && (KNOWN_TYPES as string[]).indexOf(t) >= 0;
}

export function slug(s: string): string {
  return (
    String(s || "card")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `card-${Date.now()}`
  );
}

export function snippet(s: string, len: number): string {
  const t = String(s || "").trim();
  if (t.length <= len) return t;
  const cut = t.lastIndexOf(" ", len);
  return (cut > 20 ? t.slice(0, cut) : t.slice(0, len)).trim() + "...";
}

export function cardTagline(c: Card): string {
  return snippet((c && c.definition) || "", 80);
}

export function cardGreeting(c: Card): string {
  try {
    const s = (c.specs || {}) as Record<string, unknown>;
    return String(s["first_message"] || s["greeting"] || "");
  } catch {
    return "";
  }
}

/** Enforce the card shape. Unknown types fall back to character. Never throws. */
export function sanitizeCard(dirty: unknown): Card | null {
  try {
    const d = (dirty || {}) as Record<string, unknown>;
    const rawType = String(d["type"] || d["cardType"] || "character");
    const type: CardType = isKnownType(rawType) ? rawType : "character";
    const so = (d["specs"] || {}) as Record<string, unknown>;
    const specs: Record<string, string> = {};
    const take = (k: string) => {
      const v = so[k];
      if (v !== undefined && v !== null && String(v) !== "") specs[k] = String(v);
    };
    // registry-declared fields + legacy greeting
    const fields = CARD_TYPE_REGISTRY[type]?.fields || [];
    for (const f of fields) take(f.key);
    take("greeting");
    take("enforcement");
    take("forkedFrom"); // lineage: starter copies update instead of multiplying
    // legacy greeting folds into first_message
    if (!specs["first_message"] && specs["greeting"]) specs["first_message"] = specs["greeting"];
    delete specs["greeting"];
    let stamp = String(d["created_at"] || "");
    if (!stamp) stamp = new Date().toISOString();
    return {
      id: String(d["id"] || ""),
      name: String(d["name"] || "Untitled"),
      type,
      image: String(d["image"] || d["avatarUrl"] || ""),
      definition: String(d["definition"] || d["persona"] || ""),
      specs,
      created_at: stamp,
    };
  } catch {
    return null;
  }
}

/** Pre-card legacy character → character card. */
export function migrateLegacyCharacter(old: unknown): Card | null {
  try {
    const o = (old || {}) as Record<string, unknown>;
    const os = (o["specs"] || {}) as Record<string, unknown>;
    const specs: Record<string, string> = {};
    const fm = o["first_message"] || o["greeting"] || os["first_message"] || os["greeting"];
    if (fm) specs["first_message"] = String(fm);
    const defParts: string[] = [];
    if (o["definition"]) defParts.push(String(o["definition"]));
    else if (o["persona"]) defParts.push(String(o["persona"]));
    if (o["scenario"]) defParts.push(String(o["scenario"]));
    if (o["exampleDialogue"]) defParts.push("Style note: " + String(o["exampleDialogue"]));
    if (os["scenario"]) defParts.push(String(os["scenario"]));
    if (os["exampleDialogue"]) defParts.push("Style note: " + String(os["exampleDialogue"]));
    return {
      id: String(o["id"] || ""),
      name: String(o["name"] || "Untitled"),
      type: "character",
      image: String(o["image"] || o["avatarUrl"] || ""),
      definition: defParts.join(" ").trim(),
      specs,
      created_at: String(o["created_at"] || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

function sanitizeOrMigrate(raw: unknown): Card | null {
  try {
    const o = (raw || {}) as Record<string, unknown>;
    if (o && o["type"] && o["definition"] !== undefined && o["specs"]) return sanitizeCard(raw);
    return migrateLegacyCharacter(raw);
  } catch {
    try {
      return sanitizeCard(raw);
    } catch {
      return null;
    }
  }
}

function normThread(t: unknown): LegacyThread {
  const o = (t || {}) as { messages?: unknown; summary?: unknown; deck?: unknown };
  return {
    messages: Array.isArray(o.messages) ? (o.messages as Msg[]) : [],
    summary: typeof o.summary === "string" ? o.summary : "",
    deck: Array.isArray(o.deck) ? (o.deck as string[]) : [],
  };
}

function normTableThread(t: unknown): TableThread {
  const o = (t || {}) as { messages?: unknown; summary?: unknown; turn?: unknown };
  return {
    messages: Array.isArray(o.messages) ? (o.messages as Msg[]) : [],
    summary: typeof o.summary === "string" ? o.summary : "",
    turn: typeof o.turn === "number" && o.turn >= 0 ? o.turn : 0,
  };
}

export function allCards(s: Pick<PersistState, "starters" | "customs">): Card[] {
  return s.starters.concat(s.customs);
}

export function getCard(s: Pick<PersistState, "starters" | "customs">, id: string): Card | null {
  for (const c of allCards(s)) if (c.id === id) return c;
  return null;
}

export function tableCards(s: Pick<PersistState, "starters" | "customs" | "table">): Card[] {
  const out: Card[] = [];
  for (const id of s.table) {
    const c = getCard(s, id);
    if (c) out.push(c);
  }
  return out;
}

export function tableCharacters(s: Pick<PersistState, "starters" | "customs" | "table">): Card[] {
  return tableCards(s).filter((c) => c.type === "character");
}

export function hasDirector(s: Pick<PersistState, "starters" | "customs" | "table">): boolean {
  return tableCards(s).some((c) => c.type === "director");
}

export function nextSpeaker(
  s: Pick<PersistState, "starters" | "customs" | "table" | "tableThreads">,
): Card | null {
  const chars = tableCharacters(s);
  if (!chars.length) return null;
  const t = tableThread(s);
  return chars[t.turn % chars.length];
}

export function tableThread(s: Pick<PersistState, "tableThreads">): TableThread {
  const k = "active_story";
  if (!s.tableThreads[k]) {
    // migrate the richest previous thread into the single active story
    const olds = Object.keys(s.tableThreads || {});
    let best: TableThread | null = null;
    for (const key of olds) {
      const cand = s.tableThreads[key];
      if (cand && Array.isArray(cand.messages) && cand.messages.length) {
        if (!best || cand.messages.length > best.messages.length) best = cand;
      }
    }
    s.tableThreads[k] = best
      ? { messages: best.messages.slice(), summary: best.summary || "", turn: best.turn || 0 }
      : { messages: [], summary: "", turn: 0 };
  }
  const t = s.tableThreads[k];
  if (!Array.isArray(t.messages)) t.messages = [];
  if (typeof t.summary !== "string") t.summary = "";
  if (typeof t.turn !== "number" || t.turn < 0) t.turn = 0;
  return t;
}

/** Seed opening lines so a fresh table is never empty. */
export function seedTableGreetings(
  s: Pick<PersistState, "starters" | "customs" | "table" | "tableThreads">,
): void {
  const t = tableThread(s as Pick<PersistState, "tableThreads">);
  if (t.messages.length) return;
  let added = false;
  for (const c of tableCharacters(s)) {
    const g = cardGreeting(c);
    if (g) {
      t.messages.push({ role: "char", content: g, authorId: c.id, authorName: c.name });
      added = true;
    }
  }
  if (added) t.turn = 1;
}

/** Random draw: 1–2 characters + up to 3 story cards (persona/location/challenge/director/style/rule). */
export function shuffleHand(all: Card[]): string[] {
  const chars = all.filter((c) => c.type === "character");
  const others = all.filter((c) => c.type !== "character");
  const pick = <T>(arr: T[]): T | null =>
    arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
  const hand: string[] = [];
  const c1 = pick(chars);
  if (c1) hand.push(c1.id);
  if (chars.length > 1 && Math.random() < 0.5) {
    const c2 = pick(chars);
    if (c2 && hand.indexOf(c2.id) < 0) hand.push(c2.id);
  }
  const wantTypes = ["persona", "location", "challenge", "director", "style", "rule"]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  for (const tp of wantTypes) {
    const pool = others.filter((c) => c.type === tp);
    const p = pick(pool);
    if (p && hand.length < 6 && hand.indexOf(p.id) < 0) hand.push(p.id);
  }
  return hand;
}

// ---- load / save ----

export async function loadState(): Promise<PersistState> {
  const hiddenStarters = (await storeGet<string[]>("hiddenStarters", [])) || [];
  // Live deck from main.pjs inside Perchance; bundled copy in dev/preview.
  let starters: Card[] = STARTER_CARDS.filter((c) => hiddenStarters.indexOf(c.id) < 0).map((c) => ({
    ...c,
    specs: { ...(c.specs || {}) },
  }));
  try {
    const live = getStarterCards();
    if (live && live.length) {
      const clean = live.map(sanitizeOrMigrate).filter(Boolean) as Card[];
      if (clean.length) starters = clean.filter((c) => hiddenStarters.indexOf(c.id) < 0);
    }
  } catch {
    /* keep the bundle */
  }
  let stored = await storeGet<unknown>("cards", null);
  if (stored === null || stored === undefined) {
    const legacy = (await storeGet<unknown[]>("customs", [])) || [];
    stored = (legacy as unknown[]).map(sanitizeOrMigrate).filter(Boolean);
    if ((legacy as unknown[]).length) await storeSet("cards", stored);
  }
  const customs = ((stored as unknown[]) || []).map(sanitizeOrMigrate).filter(Boolean) as Card[];
  const rawThreads = (await storeGet<Record<string, unknown>>("threads", {})) || {};
  const threads: Record<string, LegacyThread> = {};
  for (const k of Object.keys(rawThreads)) threads[k] = normThread(rawThreads[k]);
  let activeCharId = await storeGet<string | null>("activeCharId", null);
  if (activeCharId === null || activeCharId === undefined)
    activeCharId = await storeGet<string | null>("activeId", null);
  const base: PersistState = {
    starters,
    customs,
    hiddenStarters,
    threads,
    table: [],
    tableThreads: {},
    activeCharId,
    userName: "You",
  };
  if (
    !getCard(base, String(activeCharId || "")) ||
    getCard(base, String(activeCharId || ""))?.type !== "character"
  ) {
    const first = starters.concat(customs).find((c) => c.type === "character");
    base.activeCharId = first ? first.id : null;
  }
  const rawTable = await storeGet<string[] | null>("table", null);
  const rawTT = (await storeGet<Record<string, unknown>>("tableThreads", {})) || {};
  const tableThreads: Record<string, TableThread> = {};
  for (const k of Object.keys(rawTT)) tableThreads[k] = normTableThread(rawTT[k]);
  base.tableThreads = tableThreads;
  if (Array.isArray(rawTable)) {
    base.table = rawTable.filter((id) => !!getCard(base, id)).slice(0, 6);
  } else {
    // first run after the table upgrade: seed from the legacy active chat
    const anchor = base.activeCharId ? getCard(base, base.activeCharId) : null;
    if (anchor && anchor.type === "character") base.table.push(anchor.id);
    try {
      const legacyDeck = base.threads[String(base.activeCharId || "")]?.deck || [];
      for (const id of legacyDeck) {
        if (base.table.length >= 6) break;
        if (base.table.indexOf(id) < 0 && getCard(base, id)) base.table.push(id);
      }
    } catch {
      /* ignore */
    }
    if (!base.table.length) {
      const f0 = starters.concat(customs).find((c) => c.type === "character");
      if (f0) base.table.push(f0.id);
    }
    try {
      const lt = base.threads[String(base.activeCharId || "")];
      const nt = tableThread(base);
      if (lt && lt.messages.length && !nt.messages.length) {
        nt.messages = lt.messages.map((m) =>
          m.role === "char" && !m.authorId && anchor
            ? { ...m, authorId: anchor.id, authorName: anchor.name }
            : m,
        );
        nt.summary = lt.summary || "";
        nt.turn = nt.messages.filter((m) => m.role === "char").length;
      }
    } catch {
      /* ignore */
    }
  }
  base.table = base.table.filter((id) => !!getCard(base, id)).slice(0, 6);
  seedTableGreetings(base);
  await saveTableState(base);
  return base;
}

export async function saveCards(s: Pick<PersistState, "customs">): Promise<void> {
  await storeSet("cards", s.customs);
}
export async function saveThreads(s: Pick<PersistState, "threads">): Promise<void> {
  await storeSet("threads", s.threads);
}
export async function saveTableState(
  s: Pick<PersistState, "table" | "tableThreads">,
): Promise<void> {
  await storeSet("table", s.table);
  await storeSet("tableThreads", s.tableThreads);
}
export async function saveActive(s: Pick<PersistState, "activeCharId">): Promise<void> {
  await storeSet("activeCharId", s.activeCharId);
}
export async function saveHidden(s: Pick<PersistState, "hiddenStarters">): Promise<void> {
  await storeSet("hiddenStarters", s.hiddenStarters);
}

// ---- share / export / import ----

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(b64: string): string {
  let b = b64.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return decodeURIComponent(escape(atob(b)));
}

/** `#card=` payload for one card (image excluded — links stay short). Null when too long. */
export function shareLink(card: Card, genName: string): string | null {
  const clean = {
    id: "",
    name: card.name,
    type: card.type,
    image: "",
    definition: card.definition,
    specs: card.specs,
    created_at: card.created_at,
  };
  try {
    const b64 = b64urlEncode(JSON.stringify(clean));
    const url = `https://perchance.org/${genName}#card=${b64}`;
    if (url.length > 6000) return null;
    return `#card=${b64}`;
  } catch {
    return null;
  }
}

/** Decode a `#card=` / legacy `#c=` hash into a card, or null. */
export function decodeShareHash(hash: string): { card: Card; legacy: boolean } | null {
  try {
    let payload: unknown = null;
    let legacy = false;
    if (hash.indexOf("#card=") === 0) payload = JSON.parse(b64urlDecode(hash.slice(6)));
    else if (hash.indexOf("#c=") === 0) {
      payload = JSON.parse(b64urlDecode(hash.slice(3)));
      legacy = true;
    } else return null;
    const o = (payload || {}) as Record<string, unknown>;
    if (!o["name"]) return null;
    const card = legacy ? migrateLegacyCharacter(payload) : sanitizeCard(payload);
    if (!card) return null;
    if (!card.id) card.id = "shared-" + slug(card.name);
    return { card, legacy };
  } catch {
    return null;
  }
}

export interface BackupData {
  version: 3;
  cards: Card[];
  threads: Record<string, LegacyThread>;
  tableThreads: Record<string, TableThread>;
  table: string[];
  activeCharId: string | null;
}

export function exportBackup(s: PersistState): string {
  const data: BackupData = {
    version: 3,
    cards: s.customs,
    threads: s.threads,
    tableThreads: s.tableThreads,
    table: s.table,
    activeCharId: s.activeCharId,
  };
  return JSON.stringify(data, null, 2);
}

/** Parse a v3/v2/v1 backup file into state pieces. Throws on bad files. */
export function parseImport(data: unknown): {
  customs: Card[];
  threads: Record<string, LegacyThread>;
  tableThreads: Record<string, TableThread>;
  table: string[];
  activeCharId: string | null;
} {
  const d = (data || {}) as Record<string, unknown>;
  const incoming = (d["cards"] || d["customs"] || []) as unknown[];
  const customs = incoming.map(sanitizeOrMigrate).filter(Boolean) as Card[];
  const threads: Record<string, LegacyThread> = {};
  const rt = (d["threads"] || {}) as Record<string, unknown>;
  for (const k of Object.keys(rt)) threads[k] = normThread(rt[k]);
  const tableThreads: Record<string, TableThread> = {};
  const rtt = (d["tableThreads"] || {}) as Record<string, unknown>;
  for (const k of Object.keys(rtt)) tableThreads[k] = normTableThread(rtt[k]);
  return {
    customs,
    threads,
    tableThreads,
    table: Array.isArray(d["table"]) ? (d["table"] as string[]) : [],
    activeCharId: (d["activeCharId"] as string) || (d["activeId"] as string) || null,
  };
}

/**
 * CHANGELOG:
 * - 2026-10-21: Created — persistence contract mirroring the Perchance app (kv chatV1 + aichat-* localStorage).
 */
