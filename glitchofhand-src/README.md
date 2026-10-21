# AI Character Chat — plugin + demo

This generator is two things at once:

1. **An importable plugin core** (`main.pjs`). Other generators can import it and get
   a card-based character-chat system with prefix-cache-friendly prompts.
2. **A demo chat app** (`index.html`) that dogfoods that core: card library, equipment
   ("deck") per chat, streaming, stop/regenerate, card editor, image generation,
   persistence, export/import, share links.

## The card model

Every entity is a card with the same base shape:

```
{
  id: "card_clara_01",   // unique id (starter ids are the list names: Chloe, Riverside, ...)
  name: "Clara Oswald",  // display title
  type: "character",     // character | persona | scenario | location | challenge | director | rule
  image: "",             // portrait / visual asset: data URL, https URL, or "" for emoji fallback
  definition: "...",     // the core prose snippet: appearance, tone, atmosphere, or rules
  specs: { ... },        // modular fields, unlocked conditionally by type (see below)
  created_at: "..."      // ISO timestamp
}
```

In `main.pjs` source the property is called `cardType` (not `type`) and specs live in
a `specs` sublist — this avoids collisions with list-tree internals. The plugin
functions translate to the clean `type` / `specs` shape above, so importers and the
demo app only ever see the clean shape.

### Card types and their unlocked spec fields

Defined once in `root.getCardTypes()` — the single source of truth:

- `character` — `first_message` (opening line; legacy `greeting` still read),
  `voice_preset`, `public_state`, `private_state`.
- `location` — `visual_anchor`, `public_state`, `private_state`.
- `challenge` — `public_state` (objectives, countdowns), `private_state`.
- `rule` — `enforcement` (`strict`|`guideline` select), `public_state`, `private_state`.
- `persona`, `scenario`, `director`, `style` — base shape only. All prose in `definition`.

`public_state` / `private_state` are multiline `KEY: value` text (semicolons also
split lines, so single-line starter values work). `root.parseBracketLines` turns
them into objects; `root.getBrackets(card)` returns `{public, private}` and
`root.bracketLine(map)` renders them sorted. Public brackets go into every
prompt; private brackets reach only the card's own speaker turn and the director
staging pass — everyone else's prompt omits them with a one-line filter. No
regex, no telepathy. `sanitizeCard` also accepts a vision-literal nested
`specs.brackets = {public: {...}, private: {...}}` object and folds it into the
flat text fields.

To add a field later: append one field entry to that type in `getCardTypes()`
and, if it should steer the AI, one line in `root.cardPromptSection()`. Nothing
else needs to change.

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
- `root.chatPlugin.cardPromptSection(card, includePrivate?)` → one stable prompt
  section for a card. Private brackets render only when `includePrivate` is true.
- `root.chatPlugin.parseBracketLines(text)` / `getBrackets(card)` / `bracketLine(map)`
  → the public/private bracket toolkit.
- `root.chatPlugin.buildTablePrompt(hand, messages, summary, speaker, directorNotes, task)`
  → `{instruction, startWith, stopSequences}` for one speaker turn at a table of
  1–6 cards. `speaker` is a character card (or `null` for narrator). Other
  characters render as `OTHER CHARACTER` with public state only. When
  `directorNotes` is non-empty the speaker must open with a `<think>` block and
  `startWith` forces it.
- `root.chatPlugin.buildDirectorPrompt(hand, messages, summary, nextSpeakerName)`
  → the hidden staging pass. Sees every card with private brackets included.
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
  (`buildDirectorPrompt`, sees all privates) seeds the speaker's `<think>` block,
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
- Share: `#card=` links (card JSON, image excluded); legacy `#c=` links still import.
- Export v3 `{version, cards, threads, tableThreads, table, activeCharId}`; v2/v1 backups still import.
- Sidebar footer = full-width "+ New card". All nine actions live in a
  static block at the top of the sidebar (Card / Table / Data sections).
- Console helper: `window.aiCharacterChat = {cards, getCard, getThread, deckFor, table, send, banter, buildPrompt}`.

## File layout

- `main.pjs` — imports, `$meta`, `chatDefaults`, `cards` (3 character + persona,
  location, challenge, director, style, rule starters), bracket helpers, prompt
  builders (deck + table + director), token estimators, reply helpers.
- `index.html` — styles + layout + app JS (no Perchance square blocks; all `root.*`).
  The page also owns a small local mirror of the bracket toolkit
  (`parseBracketLines` / `getBrackets` / `bracketLine`, same behavior as the
  `main.pjs` canonicals) so UI code can use plain objects freely; the hint
  counter delegates to it. Prompt builders, estimators, and the card registry
  stay canonical in `main.pjs` — the page calls them via `root.*`.
- `src/cards/` — the unified card component family (React 19 + htm, zero
  build, per the Builder React+TS+Tailwind stack adapted for Perchance: no
  Next.js/TS compiler — JSDoc types in `types.js` instead; Tailwind via the
  Play CDN with preflight off and glitch tokens inlined in `index.html`).
  One renderer for binder rows, board slots, avatars, and type badges.
  `renderCards`/`renderTable` mount via roots cached per container, with the
  old DOM builders kept as offline fallbacks.
- `src/README.md` — this file.

## Tuning

- `chatDefaults.keepTail` (4–60): how many recent messages survive compaction verbatim.
- `chatDefaults.summaryTriggerRatio` (0.3–1): compact when tokens exceed this fraction of budget.
- `chatDefaults.userName`: display name used in the transcript (`You:` lines) and stop sequences.
