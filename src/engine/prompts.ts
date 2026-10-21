/**
 * src/engine/prompts.ts
 * 🎭 TABLE / DIRECTOR PROMPT BUILDERS (pure — no Perchance dependency)
 *
 * Faithful port of the main.pjs canonicals (buildTablePrompt,
 * buildDirectorPrompt, cardPromptSection, tableTranscriptLines,
 * tableUserName, equippedSortOrder) **plus the bracket rendering that
 * main.pjs still lacks**: public brackets go on every card, private
 * brackets only on the current speaker's own section and the director
 * staging pass. Cards without brackets produce byte-identical output to
 * main.pjs, so the improvement is strictly additive.
 *
 * Follow-up for the Perchance side: apply the same bracket lines to
 * main.pjs `cardPromptSection` / `buildTablePrompt` (see PERCHANCE_SYNC.md).
 */

import type { Card } from "../types/card.ts";
import { bracketLine, getBrackets } from "./brackets.ts";

export interface Msg {
  role: "user" | "char" | "system";
  content: string;
  authorId?: string | null;
  authorName?: string;
}

export interface BuiltPrompt {
  instruction: string;
  startWith: string;
  stopSequences: string[];
}

export function equippedSortOrder(typeName: string): number {
  const order = [
    "persona",
    "location",
    "scenario",
    "challenge",
    "director",
    "style",
    "rule",
    "character",
  ];
  const i = order.indexOf(String(typeName));
  return i < 0 ? 99 : i;
}

function firstMessageOf(card: Card): string {
  try {
    const s = (card.specs || {}) as Record<string, unknown>;
    return String(s["first_message"] || s["greeting"] || "");
  } catch {
    return "";
  }
}

/**
 * One stable prompt section for a card. `includePrivate` true only for the
 * director staging pass and the speaker's own section — everyone else sees
 * public state only.
 */
export function cardPromptSection(card: Card, includePrivate: boolean): string {
  const c = card || ({} as Card);
  const type = String(c.type || "character");
  const name = String(c.name || "Untitled");
  const def = String(c.definition || "");
  const head =
    type === "character"
      ? `CHARACTER ${name}: ${def}`
      : type === "persona"
        ? `PLAYER PERSONA ${name}: ${def}`
        : type === "scenario"
          ? `SCENARIO ${name}: ${def}`
          : type === "location"
            ? `LOCATION ${name}: ${def}`
            : type === "challenge"
              ? `CHALLENGE ${name}: ${def}`
              : type === "director"
                ? `DIRECTION ${name}: ${def}`
                : type === "style"
                  ? `PROSE STYLE ${name}: ${def}`
                  : type === "rule"
                    ? `RULE ${name}: ${def}`
                    : `${type.toUpperCase()} ${name}: ${def}`;
  let out = head;
  if (type === "character") {
    const fm = firstMessageOf(c);
    if (fm) out += ` They sound like: ${fm}`;
  }
  const br = getBrackets(c);
  const pub = bracketLine(br.public);
  if (pub) out += ` Public state: ${pub}.`;
  if (includePrivate) {
    const priv = bracketLine(br.private);
    if (priv) out += ` Private state (only you and the director know this): ${priv}.`;
  }
  return out;
}

export function tableTranscriptLines(
  hand: Card[],
  messages: Msg[],
  userNameInput: string,
): { lines: string[]; userName: string } {
  let userName = String(userNameInput || "You");
  const charNames: Record<string, string> = {};
  try {
    for (const c of hand) {
      if (c && String(c.type) === "character") charNames[String(c.id)] = String(c.name);
    }
  } catch {
    /* ignore */
  }
  const lines: string[] = [];
  for (const m of messages) {
    if (!m) continue;
    const content = String(m.content !== undefined ? m.content : "").trim();
    if (!content) continue;
    if (m.role === "user") lines.push(`${userName}: ${content}`);
    else if (m.role === "system") lines.push(`System note: ${content}`);
    else {
      let who = String(m.authorName || charNames[String(m.authorId || "")] || "");
      if (!who) {
        try {
          const cs = hand.filter((c) => c && String(c.type) === "character");
          who = cs.length ? String(cs[0].name) : "Narrator";
        } catch {
          who = "Narrator";
        }
      }
      lines.push(`${who}: ${content}`);
    }
  }
  return { lines, userName };
}

/** Persona in hand names the player. Falls back to the speaker card, then defaults. */
export function tableUserName(hand: Card[], speaker?: Card | null): string {
  try {
    for (const c of hand || []) {
      if (c && String(c.type) === "persona") return String(c.name || "You");
    }
  } catch {
    /* ignore */
  }
  try {
    const u = (speaker as unknown as { userName?: unknown } | null)?.userName;
    if (u) return String(u);
  } catch {
    /* ignore */
  }
  return "You";
}

/** Full table prompt: a hand of 1–6 cards plus one speaker turn. */
export function buildTablePrompt(
  handInput: Card[],
  messagesInput: Msg[],
  summaryInput: string,
  speakerInput: Card | null,
  directorNotesInput: string,
  taskInput: string,
): BuiltPrompt {
  const hand = handInput || [];
  const messages = messagesInput || [];
  const summary = summaryInput || "";
  const speaker = speakerInput || null;
  const directorNotes = String(directorNotesInput || "");
  let task = taskInput || "";
  let userName = tableUserName(hand, speaker);
  const speakerName = speaker ? String(speaker.name || "Narrator") : "Narrator";
  if (!task) {
    task = speaker
      ? `Write the next response as ${speakerName}. Reply as ${speakerName} only, one turn. Stay in character. Keep it vivid and concise, one to three short paragraphs. Never break character, never mention being an AI.`
      : `Narrate the next beat of the scene in two to four vivid sentences. Do not speak for ${userName}. Never mention being an AI.`;
  }
  const t = tableTranscriptLines(hand, messages, userName);
  const lines = t.lines;
  userName = t.userName;
  const ordered = hand.slice().sort((a, b) => {
    const oa = equippedSortOrder(a.type);
    const ob = equippedSortOrder(b.type);
    if (oa !== ob) return oa - ob;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  const parts: string[] = [];
  parts.push(
    "You are roleplaying a living card-table scene. Stay in character at all times. Treat the MESSAGES log as the full conversation so far.",
  );
  for (const card of ordered) {
    if (!card) continue;
    if (speaker && String(card.id || "") === String(speaker.id || "") && speaker.id) continue;
    if (String(card.type) === "character") {
      const outsider = cardPromptSection(card, false);
      if (outsider) parts.push("OTHER CHARACTER\n" + outsider);
    } else if (String(card.type) === "director") {
      parts.push(
        `DIRECTION, invisible puppeteer, never speak as the director: ${String(card.definition || "")}`,
      );
    } else {
      const section = cardPromptSection(card, false);
      if (section) parts.push(section);
    }
  }
  if (speaker) {
    let head = `CURRENT SPEAKER ${speakerName}: ${String(speaker.definition || "")}`;
    const sfm = firstMessageOf(speaker);
    if (sfm) head += ` They sound like: ${sfm}.`;
    const own = getBrackets(speaker);
    const ownPub = bracketLine(own.public);
    if (ownPub) head += ` Your public state: ${ownPub}.`;
    const ownPriv = bracketLine(own.private);
    if (ownPriv) head += ` Your private state (no one else knows this): ${ownPriv}.`;
    parts.push(head);
  }
  const castNames: string[] = [];
  try {
    for (const c of hand) {
      if (c && String(c.type) === "character") castNames.push(String(c.name));
    }
  } catch {
    /* ignore */
  }
  if (speaker)
    parts.push(
      `Write ONLY as ${speakerName}. One turn. Do not write dialogue for ${userName} and do not narrate for ${userName}.`,
    );
  else if (castNames.length)
    parts.push(
      "No character speaks this turn. Narrate only; do not put words in any character mouth.",
    );
  parts.push(
    "Rules: never break character. Never mention being an AI or a language model. Keep continuity with earlier messages.",
  );
  if (directorNotes)
    parts.push(
      `Hidden staging from the director. Use it for subtext and physical beats. Never quote it, never mention the director: ${directorNotes}`,
    );
  if (directorNotes && speaker)
    parts.push(
      `Begin with a <think> block of one to three sentences: ${speakerName} private inner thoughts reacting to the last message in light of the staging. Then the visible reply. Never reveal the staging.`,
    );
  const headText = parts.join("\n\n");
  const summaryBlock = summary
    ? `Earlier story summary, still true unless contradicted:\n${summary}`
    : "";
  const logText = lines.join("\n\n");
  const instruction =
    headText +
    "\n\n" +
    (summaryBlock ? summaryBlock + "\n\n" : "") +
    "MESSAGES\n" +
    logText +
    "\nEND MESSAGES\nTASK: " +
    task;
  let startWith = `${speakerName}:`;
  if (directorNotes && speaker) startWith = startWith + " <think>";
  const stops = [`\n${userName}:`, "\nUser:", "\nSystem note:", "\nNarration:"];
  if (userName !== "You") stops.push("\nYou:");
  try {
    for (const c of hand) {
      if (!c || String(c.type) !== "character") continue;
      if (speaker && String(c.id) === String(speaker.id) && speaker.id) continue;
      stops.push(`\n${String(c.name)}:`);
    }
  } catch {
    /* ignore */
  }
  return { instruction, startWith, stopSequences: stops };
}

/** The hidden staging pass. Sees every card with private brackets included. */
export function buildDirectorPrompt(
  handInput: Card[],
  messagesInput: Msg[],
  summaryInput: string,
  nextSpeakerNameInput: string,
): BuiltPrompt {
  const hand = handInput || [];
  const messages = messagesInput || [];
  const summary = summaryInput || "";
  const nextName = String(nextSpeakerNameInput || "the next speaker");
  const userName = tableUserName(hand, null);
  const t = tableTranscriptLines(hand, messages, userName);
  const parts: string[] = [];
  parts.push(
    "You are the invisible director of a card-table roleplay scene. You never speak to the player. You stage subtext, pacing, and physical beats for the actors.",
  );
  const ordered = hand.slice().sort((a, b) => {
    const oa = equippedSortOrder(a.type);
    const ob = equippedSortOrder(b.type);
    if (oa !== ob) return oa - ob;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  for (const card of ordered) {
    if (!card) continue;
    if (String(card.type) === "director") {
      parts.push(`HOUSE DIRECTION ${String(card.name)}: ${String(card.definition || "")}`);
      continue;
    }
    const full = cardPromptSection(card, true);
    if (full) parts.push(full);
  }
  const headText = parts.join("\n\n");
  const summaryBlock = summary
    ? `Earlier story summary, still true unless contradicted:\n${summary}`
    : "";
  const logText = t.lines.join("\n\n");
  const task =
    `Stage the next beat for ${nextName}. Output three to five terse lines: what just shifted in the scene, ` +
    `the private subtext ${nextName} should feel, and one physical beat. No dialogue, no speeches. Address the actors, never the player.`;
  const instruction =
    headText +
    "\n\n" +
    (summaryBlock ? summaryBlock + "\n\n" : "") +
    "MESSAGES\n" +
    logText +
    "\nEND MESSAGES\nTASK: " +
    task;
  return { instruction, startWith: "Staging:", stopSequences: [] };
}

/** Remove the `Name:` prefix and any trailing stop echo. */
export function stripReply(text: string, charName: string, stops: string[]): string {
  let t = String(text || "").trim();
  const pfx = charName + ":";
  if (t.indexOf(pfx) === 0) t = t.slice(pfx.length).trim();
  for (const s of stops || []) {
    const needle = String(s || "").trim();
    if (!needle) continue;
    const i = t.lastIndexOf(needle);
    if (i > 0 && i > t.length - needle.length - 12) t = t.slice(0, i).trim();
  }
  return t.trim();
}

/** Split a leading `<think>…</think>` block from the visible reply. */
export function splitThink(text: string): { thoughts: string; visible: string } {
  let t = String(text || "").trim();
  if (t.indexOf("<think>") === 0) t = t.slice(7).trim();
  const j = t.indexOf("</think>");
  if (j >= 0) return { thoughts: t.slice(0, j).trim(), visible: t.slice(j + 8).trim() };
  return { thoughts: "", visible: t };
}

/** Fast token estimate when the backend counter is unavailable (~4 chars/token). */
export function estimateTokens(text: string): number {
  return Math.ceil(String(text || "").length / 4);
}

/**
 * CHANGELOG:
 * - 2026-10-21: Created — port of main.pjs prompt builders + bracket rendering (public always, private on self/director).
 */
