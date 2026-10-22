/**
 * src/App.tsx
 * 🛸 GLITCHOFHANDS: CARD-TABLE STAGE (canonical app)
 *
 * Full working chat app: binder (search + All + 8 type pills), 6-slot
 * board with speaker rotation, streaming AI turns (1-shot / director
 * 2-shot with <think> staging), card editor with bracket fields, read-only
 * inspector, toasts, export/import/share, kv persistence.
 *
 * In Perchance (pasted dist build) every AI/storage call goes through
 * `window.root` plugins. In plain `npm run dev` the engine bridge degrades
 * to localStorage + a labeled demo responder so the build is always
 * clickable. `npm run build` emits the single-file dist/index.html that is
 * pasted into the Perchance `index.html` field — the Vite pipeline is the
 * canon producer of that file.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { Card, CardType, CardTypeField } from "./types/card.ts";
import { CARD_TYPE_REGISTRY } from "./types/card.ts";
import { CardTile } from "./components/cards/CardTile.tsx";
import { BoardSlot, EmptySlot } from "./components/cards/BoardSlot.tsx";
import { CardModal } from "./components/cards/CardModal.tsx";
import { countBracketKeys } from "./engine/brackets.ts";
import type { Msg } from "./engine/prompts.ts";
import { splitThink, stripReply } from "./engine/prompts.ts";
import {
  buildDirectorPrompt,
  buildTablePrompt,
  estimateTableTokens,
  generateImage,
  generateText,
  generatorName,
  getIdealMaxTokens,
  hasPerchanceAI,
  preloadModel,
  storeSet,
  summaryTriggerRatio,
} from "./engine/perchance.ts";
import type { PersistState } from "./engine/store.ts";
import {
  allCards,
  cardTagline,
  decodeShareHash,
  exportBackup,
  getCard,
  hasDirector,
  loadState,
  nextSpeaker,
  parseImport,
  seedTableGreetings,
  shareLink,
  shuffleHand,
  slug,
  tableCards,
  tableCharacters,
  tableThread,
} from "./engine/store.ts";

const TABLE_MAX = 6;
const FILTER_ORDER: Array<"all" | CardType> = [
  "all",
  "character",
  "persona",
  "scenario",
  "location",
  "challenge",
  "director",
  "style",
  "rule",
];

interface Toast {
  id: number;
  text: string;
}

let toastSeq = 1;

function shortIdeal(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);
}

/** Destructive button: first click arms ("Sure?"), second fires, auto-disarms. */
function ArmButton(props: {
  onFire: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button
      type="button"
      title={props.title}
      disabled={props.disabled}
      className={`${props.className || ""}${armed ? " bg-danger/15 text-danger" : ""}`}
      onClick={() => {
        if (armed) {
          if (timer.current !== null) window.clearTimeout(timer.current);
          timer.current = null;
          setArmed(false);
          props.onFire();
        } else {
          setArmed(true);
          timer.current = window.setTimeout(() => {
            timer.current = null;
            setArmed(false);
          }, 2600);
        }
      }}
    >
      {armed ? "Sure?" : props.children}
    </button>
  );
}

interface EditorDraft {
  open: boolean;
  cardId: string | null;
  cardType: CardType;
  name: string;
  definition: string;
  specs: Record<string, string>;
  image: string;
  equip: boolean;
  avatarBusy: boolean;
}

const CLOSED_DRAFT: EditorDraft = {
  open: false,
  cardId: null,
  cardType: "character",
  name: "",
  definition: "",
  specs: {},
  image: "",
  equip: true,
  avatarBusy: false,
};

function bracketTypes(t: CardType): boolean {
  return t === "character" || t === "location" || t === "challenge" || t === "rule";
}

export function App() {
  const stateRef = useRef<PersistState | null>(null);
  const [ready, setReady] = useState(false);
  const [, setSnap] = useState(0);
  const bump = () => setSnap((n) => n + 1);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      return window.innerWidth > 760;
    } catch {
      return true;
    }
  });
  const [typeFilter, setTypeFilter] = useState<"all" | CardType>("all");
  const [search, setSearch] = useState("");
  const [inspected, setInspected] = useState<Card | null>(null);
  const [draft, setDraft] = useState<EditorDraft>(CLOSED_DRAFT);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; bottom: number; maxH: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [live, setLive] = useState<{ name: string; text: string } | null>(null);
  const [jumpVisible, setJumpVisible] = useState(false);
  const stickBottom = useRef(true);
  const generating = useRef<{ stop: () => void } | null>(null);
  const compacting = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const S = () => stateRef.current as PersistState;

  function toast(text: string) {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }

  // ---------- load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      preloadModel();
      const s = await loadState();
      // shared card via #card= / legacy #c=
      try {
        const found = decodeShareHash(window.location.hash || "");
        if (found) {
          const c = found.card;
          c.id = c.id || "shared-" + slug(c.name);
          if (!getCard(s, c.id)) {
            s.customs.push(c);
            await storeSet("cards", s.customs);
            toast(`Shared card added: ${c.name}`);
          }
          if (c.type === "character") s.activeCharId = c.id;
          if (s.table.length < TABLE_MAX && s.table.indexOf(c.id) < 0) s.table.push(c.id);
          await storeSet("table", s.table);
          await storeSet("activeCharId", s.activeCharId);
        }
      } catch {
        /* ignore bad hashes */
      }
      if (cancelled) return;
      stateRef.current = s;
      setReady(true);
      window.setTimeout(() => {
        try {
          if (window.innerWidth > 760) inputRef.current?.focus();
        } catch {
          /* ignore */
        }
      }, 300);
    })();
    return () => {
      cancelled = true;
      try {
        generating.current?.stop();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes menu / inspector / editor / sidebar, in that order.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuOpen) setMenuOpen(false);
      else if (inspected) setInspected(null);
      else if (draft.open) setDraft({ ...CLOSED_DRAFT });
      else if (sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, inspected, draft.open, sidebarOpen]);

  function scrollFeed() {
    const el = listRef.current;
    if (!el) return;
    if (stickBottom.current) {
      el.scrollTop = el.scrollHeight;
      setJumpVisible(false);
    } else {
      setJumpVisible(true);
    }
  }

  useEffect(() => {
    scrollFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, live]);

  function autoGrow() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  // ---------- table ops ----------
  async function setTable(ids: string[]) {
    const s = S();
    const seen: string[] = [];
    for (const id of ids || []) {
      if (seen.length >= TABLE_MAX) break;
      if (seen.indexOf(id) < 0 && getCard(s, id)) seen.push(id);
    }
    s.table = seen;
    const chars = tableCharacters(s);
    if (chars.length) s.activeCharId = chars[0].id;
    await storeSet("activeCharId", s.activeCharId);
    seedTableGreetings(s);
    await storeSet("table", s.table);
    await storeSet("tableThreads", s.tableThreads);
    bump();
  }

  async function toggleTable(cardId: string) {
    const s = S();
    if (!getCard(s, cardId)) return;
    if (s.table.indexOf(cardId) >= 0) {
      await setTable(s.table.filter((id) => id !== cardId));
      return;
    }
    if (s.table.length >= TABLE_MAX) {
      toast("The board holds 6 cards. Remove one first.");
      return;
    }
    await setTable([...s.table, cardId]);
  }

  function doShuffle() {
    if (generating.current) return;
    const ids = shuffleHand(allCards(S()));
    if (!ids.length) {
      toast("No cards to draw.");
      return;
    }
    void setTable(ids).then(() => {
      const names = ids.map((id) => getCard(S(), id)?.name || id).join(" + ");
      toast(`Drew: ${names}.`);
    });
  }

  // ---------- generation ----------
  async function maybeCompact() {
    if (compacting.current) return;
    const s = S();
    const hand = tableCards(s);
    if (!hand.length) return;
    const t = tableThread(s);
    if (t.messages.length <= 12) return;
    let tokens = 0;
    try {
      tokens = estimateTableTokens(hand, t.messages, t.summary, nextSpeaker(s));
    } catch {
      return;
    }
    const ideal = getIdealMaxTokens();
    if (tokens < ideal * summaryTriggerRatio()) return;
    compacting.current = true;
    try {
      const n = t.messages.length - 12;
      const boundary = String(t.messages[n - 1]?.content || "").slice(-40);
      const task =
        `Summarize the first ${n} messages into terse bullets. Fold in the earlier summary if one exists. ` +
        `Preserve names, facts, decisions, relationships, unresolved threads. Output ONLY the new summary text. ` +
        `Stop after the message ending with: ${boundary}`;
      const p = buildTablePrompt(hand, t.messages, t.summary, nextSpeaker(s), "", task);
      const res = await generateText({
        instruction: p.instruction,
        startWith: "Summary:",
        stopSequences: [],
      });
      let txt = String(res.text || "").trim();
      if (txt.indexOf("Summary:") === 0) txt = txt.slice(8).trim();
      if (txt) {
        t.summary = txt;
        t.messages = t.messages.slice(n);
        await storeSet("tableThreads", s.tableThreads);
        bump();
      }
    } catch {
      /* background compaction never blocks */
    } finally {
      compacting.current = false;
    }
  }

  async function generateTurn(extraUserText: string | null) {
    const s = S();
    const hand = tableCards(s);
    if (!hand.length) {
      toast("The board is empty. Add a card first.");
      return;
    }
    if (generating.current) {
      toast("Already generating. Stop it first.");
      return;
    }
    const t = tableThread(s);
    if (extraUserText) {
      t.messages.push({ role: "user", content: extraUserText });
      await storeSet("tableThreads", s.tableThreads);
      bump();
    }
    stickBottom.current = true;
    const speaker = nextSpeaker(s);
    const speakerName = speaker ? speaker.name : "Narrator";
    const twoShot = hasDirector(s);
    setBusyMsg(twoShot ? `Director staging ${speakerName}...` : `${speakerName} is thinking...`);
    setLive({ name: speakerName, text: "" });
    bump();

    let staging = "";
    if (twoShot) {
      try {
        const dp = buildDirectorPrompt(hand, t.messages, t.summary, speakerName);
        const dr = await generateText({
          instruction: dp.instruction,
          startWith: dp.startWith,
          stopSequences: dp.stopSequences,
        });
        staging = String(dr.text || "").trim();
        if (staging.indexOf("Staging:") === 0) staging = staging.slice(8).trim();
        setBusyMsg(`${speakerName} is thinking...`);
      } catch {
        staging = "";
      }
    }
    let prompt;
    try {
      prompt = buildTablePrompt(hand, t.messages, t.summary, speaker, staging, "");
    } catch (e) {
      setLive(null);
      setBusyMsg(null);
      toast(`Prompt build failed: ${e instanceof Error ? e.message : e}`);
      return;
    }
    let full = "";
    try {
      const req = generateText(
        {
          instruction: prompt.instruction,
          startWith: prompt.startWith,
          stopSequences: prompt.stopSequences,
          onChunk: (d) => {
            try {
              full = d.fullTextSoFar || full + (d.textChunk || "");
              let shown = full;
              if (shown.indexOf(speakerName + ":") === 0)
                shown = shown.slice(speakerName.length + 1);
              setLive({ name: speakerName, text: shown.trim() });
            } catch {
              /* ignore */
            }
          },
        },
        speakerName,
      );
      generating.current = req;
      const res = await req;
      full = res.text;
    } catch (e) {
      generating.current = null;
      setLive(null);
      setBusyMsg(null);
      toast(`Generation failed. Try again. ${e instanceof Error ? e.message : ""}`);
      bump();
      return;
    }
    generating.current = null;
    const clean = stripReply(full, speakerName, prompt.stopSequences);
    const parts = splitThink(clean);
    setLive(null);
    if (parts.visible) {
      t.messages.push(
        speaker
          ? {
              role: "char",
              content: parts.thoughts
                ? `<think>${parts.thoughts}</think>\n${parts.visible}`
                : parts.visible,
              authorId: speaker.id,
              authorName: speakerName,
            }
          : {
              role: "char",
              content: parts.visible,
              authorId: null,
              authorName: "Narrator",
            },
      );
      t.turn = (t.turn || 0) + 1;
      await storeSet("tableThreads", s.tableThreads);
    } else {
      toast("Empty reply. Try regenerating.");
    }
    setBusyMsg(null);
    bump();
    void maybeCompact();
  }

  function send(text?: string) {
    const v = String(text !== undefined ? text : inputRef.current?.value || "").trim();
    if (!v || generating.current) return;
    if (inputRef.current) {
      inputRef.current.value = "";
      autoGrow();
      inputRef.current.focus();
    }
    void generateTurn(v);
  }

  function regen() {
    if (generating.current) return;
    const s = S();
    if (!s.table.length) return;
    const t = tableThread(s);
    if (t.messages.length && t.messages[t.messages.length - 1].role === "char") {
      t.messages.pop();
      if (t.turn > 0) t.turn--;
      void storeSet("tableThreads", s.tableThreads);
      bump();
    }
    void generateTurn(null);
  }

  function stopGen() {
    if (generating.current) {
      try {
        generating.current.stop();
      } catch {
        /* ignore */
      }
      toast("Stopping...");
    }
  }

  // ---------- editor ----------
  function openEditor(cardId: string | null, preset?: CardType) {
    const s = S();
    const c = cardId ? getCard(s, cardId) : null;
    setDraft({
      open: true,
      cardId,
      cardType: c ? c.type : preset || "character",
      name: c ? c.name : "",
      definition: c ? c.definition : "",
      specs: { ...((c && c.specs) || {}) } as Record<string, string>,
      image: (c && c.image) || "",
      equip: c ? s.table.indexOf(c.id) >= 0 : s.table.length < TABLE_MAX,
      avatarBusy: false,
    });
    setMenuOpen(false);
  }

  function editorTitle(): string {
    if (!draft.cardId) return "New card";
    const c = getCard(S(), draft.cardId);
    return c ? `Edit card — ${c.name}` : "New card";
  }

  function editorSub(): string {
    if (!draft.cardId)
      return "Pick a type to unlock its fields. Plain words only — avoid square and curly brackets.";
    const c = getCard(S(), draft.cardId);
    const builtin = !!(c && S().starters.some((x) => x.id === c.id));
    return builtin
      ? "This is a starter card. Saving creates your own editable copy. Deleting hides it — Reset brings starters back."
      : "Pick a type to unlock its fields. Plain words only — avoid square and curly brackets.";
  }

  async function saveEditor() {
    const s = S();
    const info = CARD_TYPE_REGISTRY[draft.cardType];
    if (!info) {
      toast("Pick a card type.");
      return;
    }
    const name = draft.name.trim();
    if (!name) {
      toast("Give the card a name.");
      return;
    }
    const definition = draft.definition.trim();
    if (!definition) {
      toast("Write a definition — the core prose of the card.");
      return;
    }
    const bad = /[[ \]{}^]/;
    const check = [definition, name, ...Object.values(draft.specs)];
    for (const v of check) {
      if (bad.test(v)) {
        toast("Avoid [ ] { } ^ in card text.");
        return;
      }
    }
    const existing = draft.cardId ? getCard(s, draft.cardId) : null;
    const existingBuiltin = !!(existing && s.starters.some((x) => x.id === existing.id));
    const data: Card = {
      id:
        existing && !existingBuiltin
          ? existing.id
          : "card-" + slug(name) + "-" + Date.now().toString(36),
      name,
      type: draft.cardType,
      image: draft.image || "",
      definition,
      specs: { ...(draft.specs as Card["specs"]) },
      created_at:
        existing && !existingBuiltin && existing.created_at
          ? existing.created_at
          : new Date().toISOString(),
    };
    if (existingBuiltin) toast("Starter card kept as-is. Saved your copy.");
    let found = false;
    s.customs = s.customs.map((x) => {
      if (x.id === data.id) {
        found = true;
        return data;
      }
      return x;
    });
    if (!found) s.customs.push(data);
    if (existingBuiltin) {
      s.table = s.table.filter((id) => id !== (existing as Card).id);
      if (draft.equip) {
        if (s.table.length >= TABLE_MAX)
          toast("Board is full — your copy was saved to the binder.");
        else s.table.push(data.id);
      }
    } else if (draft.equip) {
      if (s.table.indexOf(data.id) < 0) {
        if (s.table.length >= TABLE_MAX) toast("Board is full — card saved to the binder.");
        else s.table.push(data.id);
      }
    } else {
      s.table = s.table.filter((id) => id !== data.id);
    }
    if (data.type === "character") s.activeCharId = data.id;
    await storeSet("table", s.table);
    await storeSet("tableThreads", s.tableThreads);
    await storeSet("activeCharId", s.activeCharId);
    await storeSet("cards", s.customs);
    setDraft({ ...CLOSED_DRAFT });
    bump();
    toast(`Saved card: ${data.name}.`);
  }

  async function deleteEditing() {
    const s = S();
    const id = draft.cardId;
    if (!id) return;
    const gone = getCard(s, id);
    const wasStarter = !!(gone && s.starters.some((x) => x.id === id));
    s.customs = s.customs.filter((x) => x.id !== id);
    if (wasStarter && s.hiddenStarters.indexOf(id) < 0) {
      s.hiddenStarters.push(id);
      s.starters = s.starters.filter((x) => x.id !== id);
      await storeSet("hiddenStarters", s.hiddenStarters);
    }
    for (const tk of Object.keys(s.threads)) {
      const th = s.threads[tk];
      if (th && Array.isArray(th.deck)) th.deck = th.deck.filter((d) => d !== id);
    }
    delete s.threads[id];
    s.table = s.table.filter((d) => d !== id);
    await storeSet("cards", s.customs);
    await storeSet("threads", s.threads);
    await storeSet("table", s.table);
    await storeSet("tableThreads", s.tableThreads);
    const still = s.activeCharId ? getCard(s, s.activeCharId) : null;
    if (!still || still.type !== "character") {
      const left = allCards(s).find((c) => c.type === "character");
      s.activeCharId = left ? left.id : null;
      await storeSet("activeCharId", s.activeCharId);
    }
    setDraft({ ...CLOSED_DRAFT });
    bump();
    toast(wasStarter ? "Starter hidden. Reset brings it back." : "Deleted.");
  }

  // ---------- derived ----------
  const hand: Card[] = ready ? tableCards(S()) : [];
  const chars = hand.filter((c) => c.type === "character");
  const charOrder: Record<string, number> = {};
  chars.forEach((ch, ix) => {
    charOrder[ch.id] = ix + 1;
  });
  const threadMsgs: Msg[] = ready ? tableThread(S()).messages : [];
  const threadSummary: string = ready ? tableThread(S()).summary : "";
  const library: Card[] = ready ? allCards(S()) : [];
  const ordered = library
    .filter((c) => c.type === "character")
    .concat(library.filter((c) => c.type !== "character"));
  const q = search.toLowerCase();
  const filtered = ordered.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (!q) return true;
    return (c.name + " " + cardTagline(c) + " " + c.type).toLowerCase().indexOf(q) >= 0;
  });
  const speaker = ready ? nextSpeaker(S()) : null;

  let statusText = "…";
  let statusTitle = "";
  if (ready) {
    if (!hand.length) {
      statusText = library.length
        ? `${library.length}${library.length === 1 ? " card" : " cards"} in the library`
        : "no cards yet";
      statusTitle = "Play a card to begin.";
    } else {
      try {
        const n = estimateTableTokens(hand, threadMsgs, threadSummary, speaker);
        const ideal = getIdealMaxTokens();
        statusText = `~${Number(n).toLocaleString()} / ${shortIdeal(ideal)} · ${hand.length}${hand.length === 1 ? " card" : " cards"} · ${threadMsgs.length} msgs${threadSummary ? " · sum" : ""}`;
        statusTitle = `Context estimate. ${threadSummary ? "Rolling summary is on." : "No summary yet."}${hasDirector(S()) ? " Director staging on (2-shot)." : " Direct replies (1-shot)."}`;
      } catch {
        statusText = `${threadMsgs.length} messages`;
      }
    }
  }

  const placeholder = !ready
    ? "Loading..."
    : !hand.length
      ? "Play a card from the binder to begin..."
      : speaker
        ? `Reply to ${speaker.name}...`
        : "Narrate the next beat...";

  // ---------- data actions ----------
  function doExport() {
    const blob = new Blob([exportBackup(S())], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "card-chat-backup.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setMenuOpen(false);
  }

  function doShare() {
    const s = S();
    const cards = tableCards(s);
    const c = cards.length ? cards[0] : s.activeCharId ? getCard(s, s.activeCharId) : null;
    if (!c) return;
    const frag = shareLink(c, generatorName());
    if (!frag) {
      toast("Card too long for a link (image excluded already?). Use Export instead.");
      return;
    }
    try {
      window.location.hash = frag;
      const url = `https://perchance.org/${generatorName()}${frag}`;
      if (navigator.clipboard) void navigator.clipboard.writeText(url).catch(() => {});
      toast("Share link copied (also in the address bar).");
    } catch {
      toast("Share failed.");
    }
    setMenuOpen(false);
  }

  async function onImportFile(f: File | undefined) {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as unknown;
      const imp = parseImport(data);
      const s = S();
      s.customs = imp.customs;
      s.threads = imp.threads;
      s.tableThreads = imp.tableThreads;
      for (const k of Object.keys(s.tableThreads)) {
        const th = s.tableThreads[k];
        if (!Array.isArray(th.messages)) th.messages = [];
        if (typeof th.summary !== "string") th.summary = "";
        if (typeof th.turn !== "number") th.turn = 0;
      }
      s.activeCharId = imp.activeCharId;
      if (
        !s.activeCharId ||
        !getCard(s, s.activeCharId) ||
        getCard(s, s.activeCharId)?.type !== "character"
      ) {
        const first = allCards(s).find((c) => c.type === "character");
        s.activeCharId = first ? first.id : null;
      }
      if (imp.table.length) {
        s.table = imp.table.filter((id) => !!getCard(s, id)).slice(0, TABLE_MAX);
      } else {
        s.table = [];
        if (s.activeCharId) s.table.push(s.activeCharId);
      }
      await storeSet("cards", s.customs);
      await storeSet("threads", s.threads);
      await storeSet("tableThreads", s.tableThreads);
      await storeSet("table", s.table);
      await storeSet("activeCharId", s.activeCharId);
      seedTableGreetings(s);
      await storeSet("tableThreads", s.tableThreads);
      bump();
      toast("Imported.");
    } catch {
      toast("Import failed: bad file.");
    }
    if (fileRef.current) fileRef.current.value = "";
    setMenuOpen(false);
  }

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-void text-muted font-mono text-sm">
        Loading the table...
      </div>
    );
  }

  const emptyBoardText =
    hand.length === 0
      ? "Empty board — tap binder cards"
      : hand.length < TABLE_MAX
        ? `${TABLE_MAX - hand.length} empty slot${TABLE_MAX - hand.length === 1 ? "" : "s"}`
        : "";

  const regFields = CARD_TYPE_REGISTRY[draft.cardType]?.fields || [];

  return (
    <div className="flex h-screen w-full flex-col bg-void/90 text-frisk overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* click-outside closes the binder */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-[5]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* Binder sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-80 md:w-96 translate-x-0" : "-translate-x-full w-0"
          } flex flex-col flex-none border-r border-gunmetal/60 bg-[#0b101a]/95 backdrop-blur-xl transition-all duration-200 z-10 overflow-hidden`}
        >
          <div className="p-4 border-b border-gunmetal/40 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
                Card Binder ({filtered.length})
              </h2>
            </div>
            <input
              type="text"
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-1.5 text-xs text-frisk placeholder-frozen focus:border-cyan focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {FILTER_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  aria-pressed={typeFilter === t}
                  title={
                    t === "all"
                      ? "Show every card"
                      : `Show only ${(CARD_TYPE_REGISTRY[t as CardType]?.label || t) as string} cards`
                  }
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    typeFilter === t
                      ? "bg-cyan text-void font-bold"
                      : "bg-chalk text-muted hover:text-frisk"
                  }`}
                >
                  {t === "all" ? "All" : CARD_TYPE_REGISTRY[t as CardType]?.label || t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 && (
              <div className="text-xs text-frozen font-mono px-1 py-3">
                {library.length ? "No cards match." : "No cards yet — create one."}
              </div>
            )}
            {filtered.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                selected={S().table.indexOf(card.id) >= 0}
                tagline={cardTagline(card)}
                builtin={S().starters.some((x) => x.id === card.id)}
                onToggle={(id) => void toggleTable(id)}
                onInspect={(c) => setInspected(c)}
              />
            ))}
          </div>

          <div className="p-3 border-t border-gunmetal/40">
            <button
              type="button"
              onClick={() => openEditor(null, "character")}
              className="w-full rounded-lg bg-cyan px-3 py-2 text-sm font-bold text-void hover:brightness-110 transition"
            >
              + New card
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => void onImportFile(e.target.files?.[0])}
            />
          </div>
        </aside>

        {/* Stage */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <section className="flex-none border-b border-gunmetal/60 bg-void/60 p-4 backdrop-blur">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {hand.map((card) => (
                <BoardSlot
                  key={card.id}
                  card={card}
                  order={charOrder[card.id] || 0}
                  onRemove={(id) => void toggleTable(id)}
                  onInspect={(c) => setInspected(c)}
                />
              ))}
              {hand.length < TABLE_MAX && (
                <EmptySlot
                  text={hand.length === 0 ? "Empty board — tap binder cards" : emptyBoardText}
                />
              )}
            </div>
          </section>

          {/* Feed */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6 relative">
            <div
              ref={listRef}
              onScroll={() => {
                const el = listRef.current;
                if (!el) return;
                stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                setJumpVisible(!stickBottom.current);
              }}
              className="flex min-h-0 flex-1 overflow-y-auto space-y-3 pr-1"
              aria-live="polite"
            >
              {hand.length === 0 && !live && (
                <div className="rounded-2xl border border-dashed border-gunmetal bg-[#0b101a]/30 p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10 border border-cyan/40 text-xl">
                    🃏
                  </div>
                  <h3 className="text-base font-medium text-frisk">The board is empty</h3>
                  <p className="mt-1 text-xs text-muted">Tap a card in the binder to play it.</p>
                </div>
              )}
              {threadMsgs.map((m, i) => (
                <FeedBubble
                  key={i}
                  msg={m}
                  onDelete={() => {
                    const t = tableThread(S());
                    t.messages.splice(i, 1);
                    void storeSet("tableThreads", S().tableThreads);
                    bump();
                  }}
                />
              ))}
              {live && (
                <div className="flex justify-start">
                  <div className="max-w-[78%]">
                    {live.name && (
                      <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-cyan">
                        {live.name}
                      </div>
                    )}
                    <div className="rounded-2xl rounded-tl-md border border-gunmetal/60 bg-chalk px-4 py-2.5 text-sm text-frisk">
                      {live.text || (
                        <span className="inline-flex gap-1 py-1">
                          <i className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" />
                          <i className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                          <i className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {jumpVisible && (
              <button
                type="button"
                onClick={() => {
                  stickBottom.current = true;
                  const el = listRef.current;
                  if (el) el.scrollTop = el.scrollHeight;
                  setJumpVisible(false);
                  inputRef.current?.focus();
                }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-cyan/50 bg-void/90 px-4 py-1 font-mono text-xs text-cyan"
                aria-label="Jump to latest"
              >
                ↓ Latest
              </button>
            )}

            {/* Bottom control bar: binder toggle | composer | status */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                title="Toggle Card Binder"
                aria-label="Toggle Card Binder"
                onClick={() => setSidebarOpen((v) => !v)}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-gunmetal bg-chalk text-frisk hover:bg-gunmetal transition-colors"
              >
                ☰
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
              <div className="mx-auto flex w-full max-w-3xl flex-1 items-center gap-0 rounded-xl border border-gunmetal bg-void/60 focus-within:border-cyan transition-colors overflow-hidden">
                <div className="relative flex-none">
                  <button
                    type="button"
                    title="Story Options"
                    aria-label="Story Options"
                    ref={menuBtnRef}
                    onClick={() => {
                      if (!menuOpen && menuBtnRef.current) {
                        const r = menuBtnRef.current.getBoundingClientRect();
                        setMenuPos({
                          left: Math.max(8, Math.min(r.left, window.innerWidth - 232)),
                          bottom: Math.max(8, window.innerHeight - r.top + 8),
                          maxH: Math.max(160, r.top - 16),
                        });
                      }
                      setMenuOpen((v) => !v);
                    }}
                    className="flex h-11 w-11 items-center justify-center bg-chalk text-frisk hover:brightness-110 border-r border-gunmetal"
                  >
                    ⚙
                  </button>
                  {menuOpen &&
                    createPortal(
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                        <div
                          className="fixed z-40 w-56 rounded-xl border border-gunmetal bg-chalk p-1.5 shadow-2xl"
                          style={{
                            left: menuPos?.left ?? 8,
                            bottom: menuPos?.bottom ?? 8,
                            maxHeight: menuPos?.maxH ?? 400,
                            overflowY: "auto",
                          }}
                        >
                        <MenuLabel>Story</MenuLabel>
                        <MenuItem onClick={regen} disabled={!!generating.current || !hand.length}>
                          Regenerate last reply
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            const t = tableThread(S());
                            t.messages = [];
                            t.summary = "";
                            t.turn = 0;
                            seedTableGreetings(S());
                            void storeSet("tableThreads", S().tableThreads);
                            bump();
                            toast("Story cleared.");
                            setMenuOpen(false);
                          }}
                          needsArm
                        >
                          Clear story
                        </MenuItem>
                        <MenuLabel>Board</MenuLabel>
                        <MenuItem
                          onClick={() => {
                            if (S().table.length) openEditor(S().table[0]);
                            else openEditor(null, "character");
                          }}
                        >
                          Edit selected card
                        </MenuItem>
                        <MenuItem onClick={doShuffle} disabled={!!generating.current}>
                          Shuffle draw
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            void setTable([]);
                            setMenuOpen(false);
                          }}
                          needsArm
                          disabled={!!generating.current}
                        >
                          Clear board
                        </MenuItem>
                        <MenuLabel>Data</MenuLabel>
                        <MenuItem onClick={doShare}>Copy share link</MenuItem>
                        <MenuItem onClick={doExport}>Export backup</MenuItem>
                        <MenuItem
                          onClick={() => {
                            fileRef.current?.click();
                          }}
                        >
                          Import backup
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            const s = S();
                            if (!s.hiddenStarters.length) {
                              toast("Nothing to restore.");
                              return;
                            }
                            s.hiddenStarters = [];
                            void storeSet("hiddenStarters", s.hiddenStarters).then(() => {
                              void loadState().then((fresh) => {
                                stateRef.current = {
                                  ...fresh,
                                  table: s.table.filter((id) => !!getCard(fresh, id)),
                                };
                                void storeSet("table", stateRef.current.table);
                                bump();
                                toast("Starters restored.");
                              });
                            });
                            setMenuOpen(false);
                          }}
                        >
                          Restore starters
                        </MenuItem>
                        </div>
                      </>,
                      document.body
                    )}
                </div>
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder={placeholder}
                  onInput={autoGrow}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-frisk placeholder-frozen focus:outline-none"
                />
                {generating.current || busyMsg ? (
                  <button
                    type="button"
                    title="Stop generating"
                    aria-label="Stop"
                    onClick={stopGen}
                    className="flex h-11 w-14 flex-none items-center justify-center bg-danger text-void font-bold"
                  >
                    ■
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      title="Skip my turn — next character speaks"
                      aria-label="Skip my turn — next character speaks"
                      onClick={() => void generateTurn(null)}
                      disabled={!chars.length}
                      className="flex h-11 w-12 flex-none items-center justify-center bg-emerald text-void text-lg font-bold hover:brightness-110 border-l border-void/30"
                    >
                      »
                    </button>
                    <button
                      type="submit"
                      title="Send"
                      aria-label="Send"
                      className="flex h-11 w-12 flex-none items-center justify-center bg-emerald text-void text-lg font-bold"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              </form>
              <span
                title={statusTitle}
                className="max-w-28 flex-none truncate rounded-lg border border-gunmetal bg-chalk px-2.5 py-1 font-mono text-[11px] text-muted tabular-nums sm:max-w-44"
              >
                {busyMsg || statusText}
              </span>
            </div>
          </section>
        </main>
      </div>

      {/* Inspector */}
      <CardModal
        card={inspected}
        isOpen={!!inspected}
        onClose={() => setInspected(null)}
        onEdit={(c) => {
          setInspected(null);
          openEditor(c.id);
        }}
      />

      {/* Editor */}
      {draft.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDraft({ ...CLOSED_DRAFT });
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gunmetal bg-chalk p-6 text-left">
            <h2 className="text-lg font-bold text-frisk">{editorTitle()}</h2>
            <p className="mt-1 text-xs text-muted">{editorSub()}</p>
            {draft.cardId && (
              <div className="mt-1 font-mono text-[11px] text-frozen">
                ID: {draft.cardId}
                {(() => {
                  const c = getCard(S(), draft.cardId as string);
                  return c?.created_at ? ` • ${c.created_at}` : "";
                })()}
              </div>
            )}
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                  Card type
                </span>
                <select
                  value={draft.cardType}
                  onChange={(e) => {
                    const t = e.target.value as CardType;
                    setDraft((d) => ({ ...d, cardType: t, specs: {} }));
                  }}
                  className="w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                >
                  {(Object.keys(CARD_TYPE_REGISTRY) as CardType[]).map((t) => (
                    <option key={t} value={t}>
                      {CARD_TYPE_REGISTRY[t]?.label || t}
                    </option>
                  ))}
                </select>
              </label>
              <div className="font-mono text-[11px] text-muted">
                {CARD_TYPE_REGISTRY[draft.cardType]?.description}
              </div>
              <label className="block">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                  Name
                </span>
                <input
                  value={draft.name}
                  maxLength={60}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                  Definition — the core prose
                </span>
                <textarea
                  value={draft.definition}
                  onChange={(e) => setDraft((d) => ({ ...d, definition: e.target.value }))}
                  className="min-h-22.5 w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                />
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg bg-cyan/12 text-xl font-bold">
                  {draft.image ? (
                    <img src={draft.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{(draft.name.trim().charAt(0) || "?").toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    disabled={draft.avatarBusy || !hasPerchanceAI()}
                    title={
                      hasPerchanceAI()
                        ? "Generate with the image plugin"
                        : "Image generation needs the Perchance plugins"
                    }
                    onClick={() => {
                      const nm = draft.name.trim() || "character";
                      setDraft((d) => ({ ...d, avatarBusy: true }));
                      void generateImage(
                        `portrait of ${nm}, ${(draft.definition || "").slice(0, 160)}`,
                      ).then((url) => {
                        setDraft((d) => ({
                          ...d,
                          avatarBusy: false,
                          image: url || d.image,
                        }));
                        toast(url ? "Image ready." : "No image returned.");
                      });
                    }}
                    className="rounded-lg border border-gunmetal px-3 py-1.5 text-sm text-frisk hover:bg-gunmetal disabled:opacity-40"
                  >
                    {draft.avatarBusy ? "Generating..." : "Generate image"}
                  </button>
                  <div className="mt-1 text-xs text-muted">
                    {hasPerchanceAI()
                      ? "Image prompt is derived from the name and definition."
                      : "Demo mode: image generation works in the Perchance build."}
                  </div>
                </div>
              </div>
              {regFields.map((f: CardTypeField) =>
                f.key === "enforcement" ? (
                  <label key={f.key} className="block">
                    <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                      {f.label}
                    </span>
                    <select
                      value={draft.specs[f.key] === "guideline" ? "guideline" : "strict"}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          specs: { ...d.specs, [f.key]: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                    >
                      <option value="strict">strict</option>
                      <option value="guideline">guideline</option>
                    </select>
                  </label>
                ) : (
                  <label key={f.key} className="block">
                    <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                      {f.label}
                    </span>
                    {f.multiline ? (
                      <textarea
                        value={draft.specs[f.key] || ""}
                        placeholder={f.placeholder}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            specs: { ...d.specs, [f.key]: e.target.value },
                          }))
                        }
                        className="min-h-17.5 w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                      />
                    ) : (
                      <input
                        value={draft.specs[f.key] || ""}
                        placeholder={f.placeholder}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            specs: { ...d.specs, [f.key]: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                      />
                    )}
                  </label>
                ),
              )}
              {bracketTypes(draft.cardType) && (
                <>
                  {(
                    [
                      {
                        key: "public_state",
                        label: "Public state — KEY: value lines, visible to all",
                      },
                      {
                        key: "private_state",
                        label: "Private state — KEY: value lines, hidden from others",
                      },
                    ] as const
                  ).map((b) => {
                    const n = countBracketKeys(draft.specs[b.key] || "");
                    return (
                      <label key={b.key} className="block">
                        <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                          {b.label}
                        </span>
                        <textarea
                          value={draft.specs[b.key] || ""}
                          placeholder={"MOOD: curious\nGOAL: learn your name"}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              specs: { ...d.specs, [b.key]: e.target.value },
                            }))
                          }
                          className="min-h-17.5 w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 font-mono text-xs text-frisk focus:border-cyan focus:outline-none"
                        />
                        <div className="mt-0.5 font-mono text-[11px] text-frozen">
                          {n
                            ? `${n}${n === 1 ? " key" : " keys"}${b.key === "public_state" ? " • visible to all" : " • hidden from others"}`
                            : "empty"}
                        </div>
                      </label>
                    );
                  })}
                </>
              )}
              {draft.cardType === "character" && (
                <label className="block">
                  <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                    Voice preset (optional)
                  </span>
                  <input
                    value={draft.specs["voice_preset"] || ""}
                    placeholder="e.g. warm, dry wit"
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        specs: { ...d.specs, voice_preset: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                  />
                </label>
              )}
              {draft.cardType === "location" && (
                <label className="block">
                  <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                    Visual anchor (optional)
                  </span>
                  <input
                    value={draft.specs["visual_anchor"] || ""}
                    placeholder="e.g. golden dock at dusk"
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        specs: { ...d.specs, visual_anchor: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-gunmetal bg-void/60 px-3 py-2 text-sm text-frisk focus:border-cyan focus:outline-none"
                  />
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-frisk">
                <input
                  type="checkbox"
                  checked={draft.equip}
                  onChange={(e) => setDraft((d) => ({ ...d, equip: e.target.checked }))}
                />
                Play on the board
              </label>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void saveEditor()}
                className="rounded-lg bg-emerald px-4 py-2 text-sm font-bold text-void hover:brightness-110"
              >
                Save card
              </button>
              <button
                type="button"
                onClick={() => setDraft({ ...CLOSED_DRAFT })}
                className="rounded-lg border border-gunmetal px-4 py-2 text-sm text-muted hover:bg-gunmetal hover:text-frisk"
              >
                Cancel
              </button>
              {draft.cardId && (
                <span className="ml-auto">
                  <ArmButton
                    onFire={() => void deleteEditing()}
                    className="rounded-lg border border-danger/50 px-4 py-2 text-sm text-danger hover:bg-danger/10"
                  >
                    Delete
                  </ArmButton>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-60 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-gunmetal bg-chalk/95 px-4 py-2 text-sm text-frisk shadow-xl"
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Demo-mode ribbon (dev only — never appears in the Perchance build) */}
      {!hasPerchanceAI() && (
        <div className="fixed right-3 top-16 z-40 rounded-md border border-amber/50 bg-void/85 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-amber">
          demo mode
        </div>
      )}
    </div>
  );
}

function MenuLabel(props: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-frozen">
      {props.children}
    </div>
  );
}

function MenuItem(props: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  needsArm?: boolean;
}) {
  if (props.needsArm) {
    return (
      <ArmButton
        onFire={props.onClick}
        disabled={props.disabled}
        className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-frisk hover:bg-gunmetal disabled:opacity-40"
      >
        {props.children}
      </ArmButton>
    );
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-frisk hover:bg-gunmetal disabled:opacity-40"
    >
      {props.children}
    </button>
  );
}

function FeedBubble(props: { msg: Msg; onDelete: () => void }) {
  const { msg } = props;
  const [copied, setCopied] = useState(false);
  if (msg.role === "system") {
    return (
      <div className="mx-auto max-w-[78%] text-center font-mono text-xs text-frozen">
        {msg.content}
      </div>
    );
  }
  const isUser = msg.role === "user";
  let thoughts = "";
  let visible = msg.content;
  if (!isUser) {
    const p = splitThink(msg.content);
    thoughts = p.thoughts;
    visible = p.visible;
  }
  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[78%] flex-col ${isUser ? "items-end" : ""}`}>
        {!isUser && msg.authorName && (
          <div className="mb-1 text-left font-mono text-[11px] uppercase tracking-wider text-cyan">
            {msg.authorName}
          </div>
        )}
        {thoughts && (
          <details className="mb-1 w-full rounded-lg border border-purple/30 bg-purple/5 px-3 py-1.5 text-xs italic text-muted">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider not-italic">
              thoughts
            </summary>
            <div className="pt-1 whitespace-pre-wrap">{thoughts}</div>
          </details>
        )}
        <div
          className={`px-4 py-2.5 text-left text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "rounded-2xl rounded-br-md bg-cyan text-void"
              : "rounded-2xl rounded-tl-md border border-gunmetal/60 bg-chalk text-frisk"
          }`}
        >
          {visible}
        </div>
        <div className="mt-1 hidden gap-1 group-hover:flex [@media(hover:none)]:flex focus-within:flex">
          <button
            type="button"
            onClick={() => {
              try {
                void navigator.clipboard.writeText(visible);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              } catch {
                /* ignore */
              }
            }}
            className="rounded border border-gunmetal px-1.5 py-0.5 font-mono text-[10px] text-frozen hover:text-frisk"
          >
            {copied ? "copied" : "copy"}
          </button>
          <button
            type="button"
            onClick={props.onDelete}
            className="rounded border border-gunmetal px-1.5 py-0.5 font-mono text-[10px] text-frozen hover:text-danger"
          >
            delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
