---
name: design
description: Visual design system and token compiler. Use when authoring DESIGN.md or running token sync.
---

# GlitchOfHands Design Skill

Enforces the Card-Table Design Language defined in `DESIGN.md`:

- **Chrome recedes, scene advances.**
- **Accent Lock**: Cyan = presence/focus, Emerald = go/action.
- **Surfaces**: Glass chassis, sunken wells, peak chalk panels.
- **Tokens**: Synchronized via `npm run sync:css`.

## Sync pipeline (the scripts talk to each other)

- `sync:css` compiles DESIGN.md frontmatter into `src/index.css`, then
  appends the §5 "Macro Layout & Platform Overrides" block (extracted live
  from DESIGN.md — single source of truth) and inlines
  `platform-normalize-fix.css` LAST. Never hand-edit `index.css`; never
  duplicate §5 anywhere else. Missing sources warn, never fail.
- `sync:classes --check` (CI gate) hunts hardcoded color classes AND audits
  platform-normalize coverage: utilities on section/main/button/input/
  textarea/select/h1 without a matching override, plus orphaned overrides
  matching nothing (P3). Coverage is warn-only (variant matching is fuzzy);
  hardcoded colors still hard-fail.
- Order: `sync:css` → `sync:classes`. Inclusion and order belong to
  sync:css; coverage and freshness belong to sync:classes.
