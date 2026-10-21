# GitHub sync — Vite becomes the canon producer of `index.html`

Drop-in bundle. Copy every file over the repo at the same relative path
(`src/App.tsx` → `<repo>/src/App.tsx`, etc.), then:

```bash
npm install
npm run dev     # demo mode: localStorage + labeled demo replies, always clickable
npm run build   # emits the single-file dist/index.html
```

Deploy to Perchance: open `dist/index.html`, copy its **entire contents**,
paste into the Perchance `index.html` field, save. (Full-document paste is
the established flow — the previous static shell rendered the same way.)
Inside Perchance, `window.root` provides the real `ai-text-plugin`,
`text-to-image-plugin`, and `kv-plugin`, and the app uses them; outside
Perchance it degrades to localStorage + demo replies with a "demo mode"
ribbon. Nothing else to configure.

## What changed and why

The old `src/App.tsx` was a static wireframe: no AI, no persistence, no
editor — pasting its build is what kept blanking the main window. This
bundle ports the entire working Perchance app (62 KB of verified `app.js`
logic) into React 19 + TS, reusing your existing `CardTile`, `BoardSlot`,
`CardAvatar`, `TypeBadge`, and token system untouched:

- `src/engine/brackets.ts` — NEW. `parseBracketLines` / `getBrackets` /
  `bracketLine` / `countBracketKeys`, ported 1:1 from main.pjs + app.js.
- `src/engine/prompts.ts` — NEW. `cardPromptSection`,
  `tableTranscriptLines`, `tableUserName`, `buildTablePrompt`,
  `buildDirectorPrompt`, `stripReply`, `splitThink`, `estimateTokens`.
  Behavior matches main.pjs, **plus bracket rendering that main.pjs still
  lacks** (see below).
- `src/engine/perchance.ts` — NEW. The only file that touches
  `window.root`: kv load/save (folder `chatV1`, `aichat-*` localStorage
  fallback — same keys as the Perchance app), `generateText` with
  streaming + stop + demo fallback, `generateImage`, preloading, and
  prompt/estimate delegation (root canonicals win when present).
- `src/engine/store.ts` — NEW. Cards/threads/table state, starter seeding
  from `STARTER_CARDS`, sanitize/migrate, greetings, shuffle, v3
  export/import, `#card=` / legacy `#c=` share links. Same JSON contract
  as the Perchance app, so backups are interchangeable.
- `src/App.tsx` — REWRITTEN. Binder (search + **All + all 8 type pills** —
  this also applies the pending pills fix), 6-slot board with rotation
  badges, chat feed (bubbles, collapsible `<think>`, hover copy/delete,
  scroll pin + Latest pill), composer (status, autogrow input, Stop /
  Banter » / Send ›, ⚙ options menu with all 9 actions), full card editor
  (type fields + enforcement select + public/private bracket textareas with
  live key-count hints + avatar generation + starter-copy semantics), card
  inspector via `CardModal`, toasts, Escape handling, arm-to-confirm on
  destructive buttons.
- `src/components/cards/CardModal.tsx` — EXTENDED. Public/private bracket
  display, optional `onEdit` entry button, backdrop-click close.
- `index.html` — FONTS + TITLE. Google Fonts (Inter/Ubuntu/JetBrains Mono,
  matching DESIGN.md) and the `GlitchOfHands` title. They survive
  single-file inlining as external links.

Untouched on purpose: `src/types/card.ts`, `src/data/starter-cards.ts`
(already 1:1 with main.pjs), `src/index.css` tokens, `DESIGN.md`,
`sync-css` / `sync-ignores`, `vite.config.ts`, `main.tsx`.

## Canon map (no more drift)

| Concern                         | Canonical owner                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Card shape, registry, starters  | `src/types/card.ts` + `src/data/starter-cards.ts` (mirrored in main.pjs `cards` list for importers) |
| Prompt wording, bracket toolkit | `src/engine/*.ts` (this repo). main.pjs stays as the Perchance-importer mirror                      |
| Built page                      | `npm run build` → `dist/index.html` → pasted to Perchance `index.html`                              |
| Design tokens                   | `DESIGN.md` → `src/index.css` (unchanged flow)                                                      |

## Follow-up: teach main.pjs the bracket lines (6 lines)

The TS `cardPromptSection` renders `Public state:` on every card and
`Private state:` when `includePrivate` is true; `buildTablePrompt` adds the
speaker's own public+private to their section. main.pjs never rendered
brackets at all, so prompts there still ignore bracket text. Apply the same
lines to main.pjs `cardPromptSection` (after the `head` is built, before
`return`):

```
  let br = root.getBrackets(c);
  let pub = root.bracketLine(br.public);
  if (pub) out = out + " Public state: " + pub + ".";
  if (includePrivate) {
    let priv = root.bracketLine(br.private);
    if (priv) out = out + " Private state (only you and the director know this): " + priv + ".";
  }
```

and in `buildTablePrompt`, after the `CURRENT SPEAKER` head + first-message
lines:

```
    let own = root.getBrackets(speaker);
    let ownPub = root.bracketLine(own.public);
    if (ownPub) head = head + " Your public state: " + ownPub + ".";
    let ownPriv = root.bracketLine(own.private);
    if (ownPriv) head = head + " Your private state (no one else knows this): " + ownPriv + ".";
```

Cards without brackets produce byte-identical prompts, so this is safe for
existing imports.

## Verify

```bash
npx oxlint --fix && npx oxfmt
npm run build   # tsc -b && vite build, must be 0 errors
```

Then `npm run dev` click-through: binder filter pills (All + 8), toggle
cards onto the board, Banter with an empty box (demo reply streams),
editor open/save for each type, inspector ⋯ on a board slot, Export
downloads v3 JSON. Then build → paste → save in Perchance and confirm the
demo ribbon is gone (real AI) and the library count matches.
