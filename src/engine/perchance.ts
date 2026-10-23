/**
 * src/engine/perchance.ts
 * 🌐 PERCHANCE RUNTIME BRIDGE (kv + AI + canonical prompt delegation)
 *
 * Inside Perchance (pasted dist/index.html, or `npm run dev` with plugins
 * mocked) this talks to the real plugins via `window.root`. Outside
 * Perchance (`npm run dev` in a plain browser) every call degrades to a
 * local fallback: localStorage persistence, char/4 token estimates, and a
 * clearly-labeled demo responder — so `npm run build` never breaks and the
 * app is always clickable.
 *
 * Canonical rule: when `root.buildTablePrompt` / `root.buildDirectorPrompt`
 * / `root.estimateTableTokens` exist (real Perchance page), they are used —
 * main.pjs stays the prompt authority there. The local ports in
 * `prompts.ts` only run in dev/demo mode.
 */

import type { Card } from "../types/card.ts";
import type { Msg } from "./prompts.ts";
import {
  buildDirectorPrompt as localDirector,
  buildTablePrompt as localTable,
  estimateTokens as localEstimate,
} from "./prompts.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRoot = any;

function getRoot(): AnyRoot | null {
  try {
    const w = window as unknown as { root?: AnyRoot };
    return w.root || null;
  } catch {
    return null;
  }
}

/** True when the page provides the real AI text plugin. */
export function hasPerchanceAI(): boolean {
  try {
    const r = getRoot();
    return !!(r && typeof r.generateText === "function");
  } catch {
    return false;
  }
}

export function generatorName(): string {
  try {
    return (window as unknown as { generatorName?: string }).generatorName || "glitchofhand";
  } catch {
    return "glitchofhand";
  }
}

// ---- storage: kv-plugin folder chatV1, localStorage fallback (same keys as the Perchance app) ----

function kvFolder(): AnyRoot | null {
  try {
    const r = getRoot();
    if (r && r.kv && r.kv.chatV1) return r.kv.chatV1;
  } catch {
    /* ignore */
  }
  return null;
}

function lsGet<T>(key: string, fb: T): T {
  try {
    const v = localStorage.getItem("aichat-" + key);
    return v === null ? fb : (JSON.parse(v) as T);
  } catch {
    return fb;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem("aichat-" + key, JSON.stringify(value));
  } catch {
    /* storage full / private mode — app still runs in memory */
  }
}

export async function storeGet<T>(key: string, fb: T): Promise<T> {
  const f = kvFolder();
  if (f) {
    try {
      const v = await f.get(key);
      return v === undefined || v === null ? fb : (v as T);
    } catch {
      /* fall through to localStorage */
    }
  }
  return lsGet(key, fb);
}

export async function storeSet(key: string, value: unknown): Promise<void> {
  const f = kvFolder();
  if (f) {
    try {
      await f.set(key, value);
    } catch {
      /* fall through */
    }
  }
  lsSet(key, value);
}

// ---- generation ----

export interface GenChunk {
  fullTextSoFar?: string;
  textChunk?: string;
}

export interface GenRequest {
  instruction: string;
  startWith?: string;
  stopSequences?: string[];
  onChunk?: (d: GenChunk) => void;
}

export interface GenHandle {
  stop: () => void;
}

export type GenResult = Promise<{ text: string }> & { stop: () => void };

/** Demo responder for `npm run dev` (no plugins). Streams word-by-word so the UI path is identical. */
function mockGenerateText(req: GenRequest, speakerName: string): GenResult {
  let stopped = false;
  const body =
    `(demo mode — paste the build into Perchance for live AI) ` +
    `The scene holds for a beat. ` +
    `Prompt was ${req.instruction.length} chars; start was "${req.startWith || ""}".`;
  const words = body.split(" ");
  let p: Promise<{ text: string }>;
  p = new Promise<{ text: string }>((resolve) => {
    let i = 0;
    const full0 = req.startWith ? req.startWith : "";
    const step = () => {
      if (stopped) {
        resolve({ text: words.slice(0, i).join(" ") });
        return;
      }
      i++;
      try {
        if (req.onChunk) req.onChunk({ fullTextSoFar: full0 + words.slice(0, i).join(" ") });
      } catch {
        /* ignore */
      }
      if (i >= words.length) resolve({ text: words.join(" ") });
      else setTimeout(step, 60);
    };
    setTimeout(step, 120);
  }) as Promise<{ text: string }>;
  const out = p as GenResult;
  out.stop = () => {
    stopped = true;
  };
  void speakerName;
  return out;
}

export function generateText(req: GenRequest, speakerName = ""): GenResult {
  const r = getRoot();
  if (r && typeof r.generateText === "function") {
    try {
      const raw = r.generateText({
        instruction: req.instruction,
        startWith: req.startWith,
        stopSequences: req.stopSequences,
        onChunk: req.onChunk,
      });
      // ai-text-plugin returns a thenable with .stop()
      const p = Promise.resolve(raw).then((res: unknown) => {
        if (typeof res === "string") return { text: res };
        const o = res as { text?: unknown; generatedText?: unknown } | null;
        const t = o && (o.text !== undefined ? o.text : o.generatedText);
        return { text: String(t !== undefined && t !== null ? t : res) };
      });
      const out = p as GenResult;
      out.stop = () => {
        try {
          if (raw && typeof raw.stop === "function") raw.stop();
        } catch {
          /* ignore */
        }
      };
      return out;
    } catch {
      /* fall through to mock */
    }
  }
  return mockGenerateText(req, speakerName);
}

/** Avatar image: real plugin in Perchance, null in dev. */
export async function generateImage(prompt: string): Promise<string | null> {
  const r = getRoot();
  if (r && typeof r.generateImage === "function") {
    try {
      const res = await r.generateImage(prompt);
      const o = res as { dataUrl?: unknown } | null;
      if (o && typeof o.dataUrl === "string" && o.dataUrl) return o.dataUrl;
      if (typeof res === "string" && res) return res;
    } catch {
      return null;
    }
  }
  return null;
}

/** Pre-warm the model (no-op outside Perchance). */
export function preloadModel(): void {
  try {
    const r = getRoot();
    if (r && typeof r.generateText === "function") r.generateText({ preload: true });
  } catch {
    /* ignore */
  }
}

// ---- prompt + token delegation (root when present, local port otherwise) ----

export function buildTablePrompt(
  hand: Card[],
  messages: Msg[],
  summary: string,
  speaker: Card | null,
  staging: string,
  task: string,
): { instruction: string; startWith: string; stopSequences: string[] } {
  const r = getRoot();
  try {
    if (r && typeof r.buildTablePrompt === "function")
      return r.buildTablePrompt(hand, messages, summary, speaker, staging, task);
  } catch {
    /* fall through */
  }
  return localTable(hand, messages, summary, speaker, staging, task);
}

export function buildDirectorPrompt(
  hand: Card[],
  messages: Msg[],
  summary: string,
  nextSpeakerName: string,
): { instruction: string; startWith: string; stopSequences: string[] } {
  const r = getRoot();
  try {
    if (r && typeof r.buildDirectorPrompt === "function")
      return r.buildDirectorPrompt(hand, messages, summary, nextSpeakerName);
  } catch {
    /* fall through */
  }
  return localDirector(hand, messages, summary, nextSpeakerName);
}

export function estimateTableTokens(
  hand: Card[],
  messages: Msg[],
  summary: string,
  speaker: Card | null,
): number {
  const r = getRoot();
  try {
    if (r && typeof r.estimateTableTokens === "function")
      return Number(r.estimateTableTokens(hand, messages, summary, speaker)) || 0;
  } catch {
    /* fall through */
  }
  const p = localTable(hand, messages, summary, speaker, "", "Write the next response.");
  return localEstimate(String(p.instruction || "") + String(p.startWith || ""));
}

export function getIdealMaxTokens(): number {
  // Dev/no-root fallback only. In production the window comes from
  // root.getIdealMaxTokens() (live metaobject; main.pjs owns its fallback).
  const FALLBACK_WINDOW = 6000;
  try {
    const r = getRoot();
    if (r && typeof r.getIdealMaxTokens === "function")
      return Number(r.getIdealMaxTokens()) || FALLBACK_WINDOW;
    if (r && typeof r.generateText === "function") {
      const meta = r.generateText({ getMetaObject: true }) as { idealMaxContextTokens?: unknown };
      if (meta && Number(meta.idealMaxContextTokens)) return Number(meta.idealMaxContextTokens);
    }
  } catch {
    /* ignore */
  }
  return FALLBACK_WINDOW;
}

export function summaryTriggerRatio(): number {
  try {
    const r = getRoot();
    const s = Number(r && r.settings && r.settings.tokens && r.settings.tokens.budgetRatio);
    if (s > 0 && s < 1) return s;
    const n = Number(r && r.chatDefaults && r.chatDefaults.summaryTriggerRatio);
    if (n > 0.3 && n < 1) return n;
  } catch {
    /* ignore */
  }
  return 0.9;
}

/**
 * CHANGELOG:
 * - 2026-10-21: Created — Perchance bridge with local fallbacks so `npm run dev` works plugin-free.
 */
