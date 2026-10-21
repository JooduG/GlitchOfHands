# Interactability fix — composer sinkhole + touch tools

Unzip at the repo root (paths are repo-relative), then:

```bash
node fix-interactability.js
npm run build   # must be 0 errors
```

Then paste `dist/index.html` into the Perchance `index.html` field as usual.

## What was wrong

The feed `<section>` and the message scroll list were missing `min-h-0`.
Flex children default to `min-height: auto`, so once the story outgrew the
viewport the section refused to shrink and stretched instead — pushing the
composer (Send, textarea, options) below the fold where it was clipped and
dead. Sidebar pills kept working (independent scroll container), which is
why only *some* controls felt broken. Verified live: composer at y=1276 in
an 1122px viewport before the fix, back at y=888 after.

The copy/delete buttons on messages were `display:none` until `group-hover`,
so touch devices (no hover) and keyboard users could never reach them. They
now also show under `[@media(hover:none)]` and `focus-within`.

## If the script reports a pattern not found

Your components drifted from these exact class strings. Search `src/` for
the fragment and apply the same addition by hand:

| Find | Add |
|---|---|
| `flex flex-1 flex-col overflow-hidden p-4 md:p-6 relative` (feed section) | `min-h-0` |
| `flex-1 overflow-y-auto space-y-3 pr-1` (scroll list) | `min-h-0` |
| `hidden gap-1 group-hover:flex` (message tools) | `[@media(hover:none)]:flex focus-within:flex` |

The script is idempotent — safe to re-run after hand edits.
