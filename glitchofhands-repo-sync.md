# GlitchOfHands — repo sync patch (from the Perchance workspace, Oct 21 2026)

Direction: Perchance workspace → GitHub repo. The Perchance side is now in
tune with `main` (starters + registry match 1:1). This file holds the one
reverse change worth applying to the repo, plus the standing division of
labor so the two sides don't drift.

## 1. Apply: filter pills for all 8 card types (`src/App.tsx`)

The repo's binder pills are `['all', 'character', 'persona', 'location',
'director', 'rule']` — `scenario`, `challenge`, and `style` cards exist in
the starter deck but have no pill, so they're unreachable by filter. The
Perchance side ships All + all 8 types. One-line fix:

```diff
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -116,7 +116,7 @@
             {/* Type Filter Pills */}
             <div className="flex flex-wrap gap-1">
-              {['all', 'character', 'persona', 'location', 'director', 'rule'].map((t) => (
+              {['all', 'character', 'persona', 'scenario', 'location', 'challenge', 'director', 'style', 'rule'].map((t) => (
                 <button
                   key={t}
                   type="button"
```

## 2. No action needed (already in tune)

- Starters (`src/data/starter-cards.ts`): identical content to `main.pjs`.
- Registry (`src/types/card.ts`): same 8 types/fields as `root.getCardTypes()`
  (repo additionally carries per-type `color`, which the Perchance side
  hardcodes in `src/cards/components.js` — same hex values).
- `BoardSlot` ⋯ inspect + `CardModal`: already in the repo; the Perchance
  side just gained its own port of them (⋯ button + `#inspectOverlay`).

## 3. Division of labor (to avoid future drift)

- GitHub repo = Vite static shell + design system (`DESIGN.md` tokens,
  `sync:css` / `sync:ignores`). No AI, no persistence — port UI ideas out.
- Perchance workspace (`main.pjs` + `index.html` + `src/cards/`) = the
  working engine: prompts, streaming, kv persistence, editor, export/import.
  Port engine behavior back as plain data/wording (starters, registry).

## 4. Known gap on both sides (follow-up, not a patch)

`cardPromptSection(card, includePrivate)` takes the flag but never renders
`public_state` / `private_state`, and neither editor exposes bracket inputs.
Epistemic partitioning is toolkit-only until prompts + editor fields are
wired end to end. Decide the prompt wording once, then apply it to
`main.pjs` first (it is canonical for importers).
