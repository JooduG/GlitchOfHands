# GlitchOfHands 🛸

> **AI character chat, roleplay, and multi-agent card simulation engine**  
> Powered by React 19, TypeScript, Tailwind CSS v4, and Perchance plugins (`ai-text-plugin`, `text-to-image-plugin`, `kv-plugin`).

Built using the principles from the _React + AI Stack for 2026_, designed for high type safety, clean component boundaries, and lean runtime overhead.

- **Live Perchance Generator**: [perchance.org/glitchofhand#edit:collab=Z4gQbylwtIzJIrqiJ68L](https://perchance.org/glitchofhand#edit:collab=Z4gQbylwtIzJIrqiJ68L)

---

## Architecture & Stack

- **Core**: React 19 + TypeScript (Strict mode)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` + `@theme` in `src/index.css`)
- **Design System**: Authoritative tokens declared in [DESIGN.md](./DESIGN.md) (Google Labs W3C token format)
- **Bundler**: Vite + `vite-plugin-singlefile` (compiles to self-contained `dist/index.html` ready for Perchance deployment)
- **Storage**: In-memory / Dexie IndexedDB fallback + Perchance KV sync

---

## The Card Model

Every entity in GlitchOfHands is a card with the same base shape:

```typescript
interface Card {
  id: string; // Unique ID (Chloe, Riverside, card_xxx...)
  name: string; // Display title
  type: CardType; // character | persona | scenario | location | challenge | director | style | rule
  image: string; // Portrait / visual asset: data URL, https URL, or "" for initial fallback
  definition: string; // Core prose snippet: appearance, tone, atmosphere, or rules
  specs: CardSpecs; // Modular fields unlocked conditionally by type
  created_at: string; // ISO timestamp
}
```

### 8 Card Types and Unlocked Fields

Defined once in `getCardTypes()` — the single source of truth:

- **`character`**: Speaking role. Unlocks `first_message`.
- **`persona`**: Protagonist roleplay identity.
- **`scenario`**: Situation, setup, or background context.
- **`location`**: Place and sensory anchor.
- **`challenge`**: Objectives and countdowns.
- **`director`**: Invisible puppeteer. Triggers 2-shot staging passes (`### Thoughts` / `### Reply` seeding).
- **`style`**: Prose voice and literary cadence.
- **`rule`**: Hard constraints. Unlocks `enforcement` dropdown (`strict` | `guideline`, default `strict`).

### Rule Enforcement

`rule` cards carry an `enforcement` dropdown. `strict` appends "Enforce this
strictly." to the prompt section, `guideline` appends "Treat this as a
guideline, not an absolute."

---

## Table-as-Stage Mechanics

- **The Hand (Table)**: 1 to 6 cards placed simultaneously on the board.
- **1 card on table**: Classic instant 1-on-1 chat.
- **2 cards (Character + Persona)**: Defined RPG (persona names the player in the transcript).
- **2+ Characters**: Group chat with rotating speaker turns (`thread.turn`) and Banter ("improvise without me").
- **Director Card on Table**: Switches turns to 2-shot: a hidden staging call seeds the speaker's `### Thoughts` section ahead of `### Reply`, rendered as a collapsible thought stream.

---

## Quick Start & Scripts

```bash
npm install
npm run dev           # Local development server with Vite HMR
npm run build         # Compiles single-file bundle to dist/index.html
npm run sync          # Syncs ignores and compiles DESIGN.md tokens to CSS
npm run sync:ignores  # Updates .gitignore and .geminiignore from ignores.master.json
npm run sync:css      # Compiles DESIGN.md YAML frontmatter into src/index.css
```

## Plugin API (main.pjs)

Import from another generator (remove the spaces around `import` — they are only
there so this README itself is not treated as using the import):

```
chatPlugin = { import : YOUR-GENERATOR-NAME }
```

Then use `root.chatPlugin.*`:

- `root.chatPlugin.getCardTypes()` → registry above (sync).
- `root.chatPlugin.getStarterCards()` → all starter cards as clean objects.
- `root.chatPlugin.getStarterCardById(idOrName)` → one card or `null`.
- `root.chatPlugin.createCardSkeleton(type)` → blank card with timestamp.
- `root.chatPlugin.sanitizeCard(dirty)` → enforce the card shape, never throws.
- `root.chatPlugin.migrateLegacyCharacter(oldChar)` → pre-card character → character card.
- `root.chatPlugin.cardPromptSection(card)` → one stable prompt
  section for a card.
- `root.chatPlugin.buildTablePrompt(hand, messages, summary, speaker, directorNotes, task)`
  → `{instruction, startWith, stopSequences}` for one speaker turn at a table of
  1–6 cards. `speaker` is a character card (or `null` for narrator). Other
  characters render as `OTHER CHARACTER` sections. When
  `directorNotes` is non-empty the speaker must open with a `### Thoughts`
  section ahead of `### Reply` and `startWith` forces it.
- `root.chatPlugin.assemblePromptCard(slots, task, stops)` → `{instruction,
  startWith, stopSequences}` for one prompt-organism generation. `slots`
  maps slot names to cards (`speaker` accepts character). Stops are wired
  from the `stopSequences` part content (split on `~~~`, one stop each)
  with caller `stops` appended.
- `await root.chatPlugin.runPromptCard(slots, task, stops)` → the
  `readFinish` shape `{text, stopReason, clean}` for the assembled envelope.
- `root.chatPlugin.buildDirectorPrompt(hand, messages, summary, nextSpeakerName)`
  → the hidden staging pass. Sees every card in full.
- `await root.chatPlugin.getTableReply(hand, messages, summary, speakerId?)` →
  `{speaker, speakerId, text, thoughts, staging}`. Runs the director pass first
  when a director card is on the table (2-shot), else a direct turn (1-shot).
- `root.chatPlugin.buildDeckPrompt(characterCard, equippedCards, messages, summary, task)`
  → `{instruction, startWith, stopSequences}`. Equipped cards are sorted into a fixed
  type order, so the prompt prefix is stable no matter what order cards were equipped in.
- `root.chatPlugin.buildChatPrompt(character, messages, summary, task)` → legacy
  single-character prompt, kept byte-identical for old imports.
- `await root.chatPlugin.getChatReply(character, messages, summary, equippedCards?)`
- `await root.chatPlugin.summarizeOldMessages(character, summary, messages, keepTail)`
- `root.chatPlugin.estimateTableTokens(hand, messages, summary, speaker)` (sync)
- `root.chatPlugin.estimateDeckTokens(character, equipped, messages, summary)` (sync)
- `root.chatPlugin.estimateChatTokens(...)`, `root.chatPlugin.getIdealMaxTokens()` (sync)
- Legacy aliases kept working: `getCharacterList()`, `getCharacterById()`.

Streaming with a deck (recommended for UI):

```
let c = root.chatPlugin.getStarterCardById("Chloe");
let equipped = [root.chatPlugin.getStarterCardById("Riverside")];
let p = root.chatPlugin.buildDeckPrompt(c, equipped, [{role:"user", content:"hi"}], "", "");
let req = root.generateText({
  instruction: p.instruction,
  startWith: p.startWith,
  stopSequences: p.stopSequences,
  onChunk: (d) => { replyEl.textContent = d.fullTextSoFar; },
});
// req.stop() aborts
let res = await req;
```

Notes:

- Keep the transcript append-only. Never rewrite old lines; only append and, rarely,
  compact via `summarizeOldMessages` then slice the folded prefix.
- Card text in `main.pjs` must avoid `[ ] { } ^` (Perchance syntax).
- Do not vendor `ai-text-plugin`. This core wraps its public API only.

## Demo app (index.html)

- Library = starter cards from `main.pjs` + customs in `kv-plugin` folder `chatV1`
  (key `cards`; legacy `customs` auto-migrated), with `localStorage` fallback.
- The table = a hand of 1–6 card ids (`table` key; threads in `tableThreads` keyed
  by sorted hand signature, each `{messages, summary, turn, hand}`). The tray shows
  type-colored slot edges plus speaker rotation badges (1, 2, 3…) on characters.
  First run after the upgrade seeds the table from the legacy active character +
  deck and carries its messages over (character messages stamped with author).
  Legacy per-character `threads` are kept for import compat.
- 1 card on the table = classic instant chat. 2 = defined RPG (persona names the
  player in the transcript). 2+ characters = group chat: speaker rotates by
  `thread.turn`, each message stores `authorId`/`authorName`, and Banter advances
  the scene without user input. No character = the Narrator speaks.
- Director card on the table switches turns to 2-shot: a hidden staging call
  (`buildDirectorPrompt`, sees all privates) seeds the speaker's `### Thoughts` section,
  rendered as a collapsible "thoughts" section. No director = fast 1-shot.
- Table section at the top of the sidebar shows the hand + mode (⚡/🎬) with
  Banter (primary-styled); Shuffle and Clear live in the Menu below. Sidebar
  taps toggle table membership.
  Destructive buttons (Clear story, Clear table, Restore starters) arm on first
  click ("Sure?") and fire on second. Editing a starter swaps its table slot for
  your copy instead of duplicating it.
- Feed QoL: message tools hide until hover on hover-capable devices; scrolling up
  pins the feed and raises a "↓" jump-to-latest pill; the composer autoresizes,
  keeps focus, and its placeholder names the next speaker. Escape closes the
  editor/drawer; a scrim closes the mobile drawer. Status line in the sidebar
  is compact (tokens · cards · msgs) with details in its tooltip.
- Breathing room: the sidebar retracts via the ☰ at the left of the composer
  (drawer on mobile, hide/show on desktop), persisted in the `ui` store. All actions sit in one
  block at the top of the sidebar (Card / Table / Data sections);
  always-visible chrome is just the action block, the composer row
  (☰, input, Send), Banter, New card, and the message bubbles. Message
  list and bubbles got roomier rhythm (24/18 padding, 14px gaps, 12/16 bubbles).
- Editor: type dropdown unlocks that type's fields including bracket textareas
  with live key-count hints ("2 keys • hidden from others"); "Play on the
  table" checkbox; starter cards save as copies.
- Binder filter pills (All + one per card type, ported from the GitHub Vite
  shell) narrow the list by type without touching search. The ⋯ button on
  board slots opens a read-only inspector (avatar, definition, first message,
  public/private brackets, role) with an Edit button into the full editor;
  slot click still edits directly, binder rows keep their Edit button.
- Share: `#card=` links (card JSON, image excluded); legacy `#c=` links still import.
- Export v3 `{version, cards, threads, tableThreads, table, activeCharId}`; v2/v1 backups still import.
- Sidebar footer = full-width "+ New card". All nine actions live in a
  static block at the top of the sidebar (Card / Table / Data sections).
- Console helper: `window.aiCharacterChat = {cards, getCard, getThread, deckFor, table, send, banter, buildPrompt}`.

## Tuning

- `chatDefaults.keepTail` (4–60): how many recent messages survive compaction verbatim.
- `chatDefaults.summaryTriggerRatio` (0.3–1): compact when tokens exceed this fraction of budget.
- `chatDefaults.userName`: display name used in the transcript (`You:` lines) and stop sequences.
