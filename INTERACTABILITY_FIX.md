# Interactability fix — composer sinkhole + touch tools + axis + colors

Unzip at the repo root (paths are repo-relative), then:

```bash
node fix-interactability.js
# then wire the normalize fix (one line, see below)
npm run build   # must be 0 errors
```

Then paste `dist/index.html` into the Perchance `index.html` field as usual.

## What was wrong (4 defects, 3 root causes)

1. **Composer sinkhole (settings cog unclickable).** The feed `<section>`
   and message list lacked `min-h-0`: once the story outgrew the viewport the
   section stretched instead of shrinking, pushing the composer (Send, input,
   options) below the fold where it was clipped and dead. Sidebar pills kept
   working (independent scroll container) — which is why only *some* controls
   felt broken.
2. **Chat on the wrong axis.** v1 of the fixer script added `flex` to the
   message list WITHOUT `flex-col`, flipping the feed into a horizontal row
   — bubbles in a sideways kanban strip. (My bad — v2 below targets
   `flex-col` and repairs both pre-v1 and post-v1 file states.)
3. **Platform reset killing section flex AND all button colors.** The
   Perchance preview wrapper injects an *unlayered* copy of normalize.css v3
   into `<head>` on every load, and unlayered CSS always beats Tailwind v4's
   `@layer` utilities. So `section{display:block}` overrode `.flex` on
   `<section>`/`<main>` (sinkhole came BACK even with `min-h-0` present),
   and `button{color:inherit; font:inherit}` overrode every `text-*`/`font-*`
   on buttons — the skip chevron lost its emerald, the cog its muted gray,
   the send glyph its void-black. The skip *face* is dark by design
   (transparent over the pill); it looked "black"/wrong because the glyph
   color was wrong. `platform-normalize-fix.css` (23 rules, generated from
   the live DOM) re-asserts exactly the affected utilities, unlayered, so it
   wins. It must be imported LAST and must stay plain CSS (never `@layer`).
4. **Touch/keyboard message tools.** Copy/delete on bubbles were
   `display:none` until `group-hover` — unreachable on touch, now also shown
   under `[@media(hover:none)]` + `focus-within`.

## Repo wiring (the durable part)

- `fix-interactability.js` → repo root, run once (`node
  fix-interactability.js`). Idempotent; exits 1 naming any pattern it didn't
  find.
- `platform-normalize-fix.css` → next to your CSS entry, imported LAST:
  `@import "./platform-normalize-fix.css";` — plain, no `@layer`. The fixer
  warns if it can't find a reference to it in `src/`.
- If you add new `text-*`/`font-*`/`display` utilities on `section`, `main`,
  `button`, `input` or `textarea` later, mirror them in that file.

## If the script reports a pattern not found

Your components drifted from these exact class strings. Search `src/` for
the fragment and apply the same addition by hand:

| Find | Add |
|---|---|
| `flex flex-1 flex-col overflow-hidden p-4 md:p-6 relative` (feed section) | `min-h-0` |
| `flex-1 overflow-y-auto space-y-3 pr-1` (scroll list, pristine) | `min-h-0` + `flex-col` |
| `flex min-h-0 flex-1 overflow-y-auto space-y-3 pr-1` (scroll list, post-v1) | `flex-col` |
| `hidden gap-1 group-hover:flex` (message tools) | `[@media(hover:none)]:flex focus-within:flex` |

## Options menu clipped by the composer pill (menu invisible on short screens)

Separate structural bug, no script fix — wire it by hand in the repo:

- The fused composer pill uses `overflow:hidden` for its rounded shape. The
  Story Options popup renders *inside* the pill and opens upward, so on
  shorter viewports it was fully clipped (invisible + unclickable) while its
  transparent scrim still covered the screen — every click near the cog
  appeared dead. Verified live: popup rect reported [209,64,224,383] but
  hit-testing found only board content underneath; all 9 items unhittable.
- Live stopgap (in `index.html` now, wiped by next paste): a small script
  repaints the popup as viewport-fixed at open time (style-only, React-safe —
  no DOM moves). Verified: all 9 items hit-test clean at 520px and 1122px
  viewports; scrim-click / toggle / Escape all close.
- Durable repo fix: render the menu in a portal (`createPortal` to
  `document.body`, `position:fixed`, coords from the cog's rect at open
  time, reposition on resize/scroll while open). Do NOT just remove the
  pill's `overflow:hidden` — the Send button's square corners rely on the
  pill's clipping for the fused look.
- Same audit, no action needed: the inspector modal is already
  viewport-fixed (`z-50`, `max-h-[90vh] overflow-y-auto` — scrolls internally
  on short screens); board popups live outside any `overflow:hidden`
  ancestor.
