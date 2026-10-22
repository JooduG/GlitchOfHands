---
name: GlitchOfHands
version: alpha
colors:
  primary: "#11aecc"
  color-void: "#05060a"
  color-frisk: "#f2f7fa"
  color-gunmetal: "#363840"
  color-frozen: "#555d66"
  color-muted: "#8b93a1"
  color-chalk: "#191b21"
  color-cyan: "#11aecc"
  color-emerald: "#10b981"
  color-danger: "#ef4444"
  color-pink: "#ec4899"
  color-amber: "#fbbf24"
  color-blue: "#3b82f6"
  color-purple: "#a855f7"
typography:
  font-base:
    fontFamily: '"Inter", sans-serif'
  font-heading:
    fontFamily: '"Ubuntu", sans-serif'
  font-mono:
    fontFamily: '"JetBrains Mono", monospace'
rounded:
  radius-sharp: 8px
  radius-standard: 14px
spacing:
  spacing-pixel: 1px
  spacing-unit: 0.25rem
motion:
  duration-fast: 150
  duration-standard: 300
  physics-curve: "cubic-bezier(0.4, 0, 0.2, 1)"
  scale-press: 0.97
backgrounds:
  app-gradient: "linear-gradient(120deg, #0b101a 0%, #14182b 40%, #1e1b38 70%, #16243b 100%)"
components:
  surface-void:
    backgroundColor: "{colors.color-void}"
    textColor: "{colors.color-frisk}"
    rounded: "{rounded.radius-standard}"
  surface-chalk:
    backgroundColor: "{colors.color-chalk}"
    textColor: "{colors.color-frisk}"
    rounded: "{rounded.radius-standard}"
  surface-gunmetal:
    backgroundColor: "{colors.color-gunmetal}"
    textColor: "{colors.color-frisk}"
    rounded: "{rounded.radius-sharp}"
  button-go:
    backgroundColor: "{colors.color-emerald}"
    textColor: "{colors.color-void}"
    rounded: "{rounded.radius-sharp}"
  button-presence:
    backgroundColor: "{colors.color-cyan}"
    textColor: "{colors.color-void}"
    rounded: "{rounded.radius-sharp}"
  button-danger:
    backgroundColor: "{colors.color-danger}"
    rounded: "{rounded.radius-sharp}"
  text-muted:
    textColor: "{colors.color-muted}"
  text-frozen:
    textColor: "{colors.color-frozen}"
  edge-persona:
    backgroundColor: "{colors.color-pink}"
  edge-scenario:
    backgroundColor: "{colors.color-blue}"
  edge-director:
    backgroundColor: "{colors.color-amber}"
  edge-style:
    backgroundColor: "{colors.color-purple}"
  brand-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.color-void}"
    rounded: "{rounded.radius-sharp}"
---

# Card-Table Design Language

A holistic design system for **GlitchOfHands**: one vision, one token set, one motion grammar, one voice contract, and a restraint budget that keeps every screen minimal. Distilled from `imageglitch` (taste) and `rpglitch` (governance).

## 1. Vision — The Story is the Interface

- **Chrome recedes, scene advances.** The feed is the product; every panel, button, and label exists to serve it. If an element doesn't help the user understand _who is speaking, what is happening, or what happens next_, it moves into the sidebar or behind the ⋯ Menu.
- **Sidebar-first console.** The left panel is mission control: who (peer), how much (tokens), with whom (table), from what (deck), and everything else (Menu). The main column carries only the scene (bubbles) and the stage door (composer).
- **Table-as-stage.** The hand of cards is a cast list: rotation badges are the speaking order, the mode line (⚡/🎬) is the house-light state, Banter is "improvise without me."
- **Dual voice.** Story space is warm and playful (Banter, Shuffle, emoji); system chrome is clinical and terse (mono labels, tooltips, "Sure?"). Never mix them in one string.

## 2. Tokens

### Fonts — Three Voices, One Accent

- **Inter** (`--font-base`): everything the user reads — body, inputs, non-heading buttons. Weights 300/400/600/800.
- **Ubuntu** (`--font-heading`): headings and `.btn`. ALWAYS `800`, ALWAYS `uppercase`, `letter-spacing: 0.05em`.
- **JetBrains Mono** (`--font-mono`): chrome labels, not content — section headers, status, badges, hints. `10–11px`, `500`, `uppercase`, `letter-spacing: 0.08–0.12em`, `--muted`. Always `font-variant-numeric: tabular-nums` for anything that updates (tokens, counts, timers) so numbers never jitter.

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;500;700&family=Ubuntu:wght@400;500;700&display=swap");
```

- **Satisfy** (accent, rpglitch heritage): brand/hero moments only, never UI. Unused so far — the single biggest untapped differentiator.

### Palette — Names are the API

| Token        | Hex       | Job                                          |
| ------------ | --------- | -------------------------------------------- |
| `--void`     | `#05060a` | page depth, input wells                      |
| `--frisk`    | `#f2f7fa` | primary text                                 |
| `--gunmetal` | `#363840` | neutral buttons, hovers, scrollbars          |
| `--frozen`   | `#555d66` | placeholders, empty states, disabled         |
| `--muted`    | `#8b93a1` | secondary text                               |
| `--chalk`    | `#191b21` | editor panels, menus, solid surfaces         |
| `--cyan`     | `#11aecc` | presence + focus: active states, rings, glow |
| `--emerald`  | `#10b981` | go: Send, Save, Banter, user bubbles         |
| `--danger`   | `#ef4444` | destructive, errors, stop                    |
| `--pink`     | `#ec4899` | persona flair, instruct-flavored actions     |
| `--amber`    | `#fbbf24` | chaos/warning, director                      |
| `--blue`     | `#3b82f6` | info, scenario                               |
| `--purple`   | `#a855f7` | style accents                                |
| `--orange`   | `#f97316` | warning buttons (reserved)                   |
| `--rose`     | `#fb7185` | error text on red washes                     |
| `--indigo`   | `#818cf8` | reserved                                     |
| `--violet`   | `#c084fc` | reserved                                     |
| `--teal`     | `#14b8a6` | reserved                                     |
| `--lime`     | `#84cc16` | reserved                                     |
| `--yellow`   | `#fde047` | reserved                                     |
| `--primary`  | `#11aecc` | alias of cyan: primary action color          |

Background: 4-stop void gradient, `120deg`, fixed: `#0b101a → #14182b → #1e1b38 → #16243b`. Dark-only.

### Accent Lock (Minimalism Rule)

Two accents, non-overlapping jobs, never in the same pixel:

- **Cyan = presence.** Focus rings, active/equipped states, rotation badges, speaker labels, glow. Answers "where am I / who is on."
- **Emerald = go.** Send, Save, Banter, user bubbles. Answers "what moves the story forward."
- Card-type colors (pink/blue/green/red/amber/purple/grey) appear ONLY as 3px slot edges and type dots — never as fills, glows, or button colors.

### Surfaces, radii, space

- **Glass chassis** (four elevations, rpglitch): sunken wells (inputs, `rgba(void,.5)`), base chrome (sidebar/composer, gunmetal 35% + blur 20px), elevated (slots, bubbles, `var(--glass)`), peak (menus, editor, solid chalk + deep shadow). Higher = more solid, never just brighter.
- **Radii**: `8px` sharp (buttons, inputs, slots, menus), `14px` standard (bubbles, cards, modals). Nothing in between.
- **Borders are earned, not default.** Avatars, badges, and footer carry none — tinted fills and whitespace do the separation. Hairlines survive only where they draw a shape: card slots, glass bubbles, editor card. Rows never add borders for decoration (the transparent row border exists solely so active/equipped highlights never shift layout).
- **Shadows tint to their surface** — never pure-black drops on tinted glass.
- **Rhythm**: feed `24px` top / `18px` sides, `14px` message gaps, `12/16` bubbles; sidebar: one inset token (`--side-pad: 12px`), `14px` between sections, `8px` in control rows, `6px` inside lists. One spacing scale, no snowflake margins.

## 3. Motion Grammar

One curve (`--physics: 150ms cubic-bezier(0.4,0,0.2,1)`), three verbs:

- **Hover = brighten** (`filter: brightness(1.2)`), never move.
- **Press = sink** (`scale(0.97)`), instant tactile answer on every pressable.
- **Enter = rise** (`translateY(8px)` + fade, 180ms); **exits are instant** (`display:none` toggles) — dismissals must never block the next action.

Frequency law: the more an element is seen, the less it may move. Hovers get 150ms; drawers/modals up to 300ms; keyboard-initiated actions get nothing. Never animate from `scale(0)` — entrances start at `≥0.95` + fade so things arrive with weight. Loading = pulse/dots (typing dots, shimmer), always paired with a cancel affordance (■ stop, hover-swap).

## 4. Conformance & Laws

- **Viewport Sovereignty**: `100dvh`, never `h-screen` (mobile address-bar jump).
- **Radii**: `8px` sharp (buttons, inputs, slots, menus), `14px` standard (bubbles, cards, modals). Nothing in between.
- **Restraint Budget**: Main column carries exactly two things: scene + stage door. Everything else lives in the sidebar or ⋯ modal.

## 5. Macro Layout & Platform Overrides

```css
@layer base {
  html {
    color-scheme: dark;
  }
  body {
    margin: 0;
    min-height: 100dvh;
    background: linear-gradient(
        120deg,
        #0b101a 0%,
        #14182b 40%,
        #1e1b38 70%,
        #16243b 100%
      )
      no-repeat fixed;
    background-size: cover;
    color: var(--color-frisk);
    font-family: var(--font-base);
    -webkit-font-smoothing: antialiased;
  }
}

/* Layout enforcement against unlayered platform resets (e.g. Perchance iframe normalize.css) */
html,
body,
#root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#root {
  display: flex;
  flex-direction: column;
}

main {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 0% !important;
  min-height: 0 !important;
  min-width: 0 !important;
  overflow: hidden !important;
  position: relative !important;
  height: 100% !important;
}

.stage-feed-container {
  flex: 1 1 0% !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
}

.bottom-stage-footer {
  flex: 0 0 auto !important;
  margin-top: auto !important;
  width: 100% !important;
}

/* --- Platform element enforcement (single source; compiled by sync-css.js) ---
 * Every Perchance preview injects an UNLAYERED normalize.css v3. Unlayered
 * rules beat Tailwind v4's @layer utilities, so two resets silently win:
 *   section/header/...{display:block} kills .flex on those elements (the feed
 *     stops being a flex column, the composer sinks below the fold);
 *   button/input/...{color:inherit;font:inherit} kills text-/font- utilities.
 * The rules below re-assert exactly the utilities this app uses on those
 * elements. They MUST stay unlayered (no @layer) and be appended LAST.
 * Coverage is audited by sync-classes.js (`missing` = add here, `orphaned` =
 * prune here, P3). */
header.flex {
  display: flex;
}
button.text-frisk {
  color: var(--color-frisk);
}
h1.text-base {
  font-size: var(--text-base);
}
@media (width>=48rem) {
  h1.md\:text-lg {
    font-size: var(--text-lg);
    line-height: var(--tw-leading, var(--text-lg--line-height));
  }
}
h1.font-bold {
  font-weight: var(--font-weight-bold);
}
aside.flex {
  display: flex;
}
input.text-xs {
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
}
input.text-frisk {
  color: var(--color-frisk);
}
button.font-mono {
  font-family: var(--font-mono);
}
button.text-\[10px\] {
  font-size: 10px;
}
button.uppercase {
  text-transform: uppercase;
}
button.text-void {
  color: var(--color-void);
}
button.text-cyan {
  color: var(--color-cyan);
}
button.text-frozen {
  color: var(--color-frozen);
}
button.font-bold {
  font-weight: var(--font-weight-bold);
}
button.text-muted {
  color: var(--color-muted);
}
button.text-frozen {
  color: var(--color-frozen);
}
button.text-xs {
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
}
button.text-sm {
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
}
main.flex {
  display: flex;
}
section.flex {
  display: flex;
}
section.flex {
  flex-direction: column;
  min-height: 0;
}
textarea.text-sm {
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
}
textarea.text-frisk {
  color: var(--color-frisk);
}
button.hover\:text-frisk:hover {
  color: var(--color-frisk);
}
button.hover\:text-danger:hover {
  color: var(--color-danger);
}
button.font-black {
  --tw-font-weight: var(--font-weight-black);
  font-weight: var(--font-weight-black);
}
button.font-medium {
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
button.text-lg {
  font-size: var(--text-lg);
  line-height: var(--tw-leading, var(--text-lg--line-height));
}
```

## 6. Components

- **Buttons** (`.btn`): Ubuntu 800, 12px, uppercase, 8px radius, min-height
  40px. Variants: `primary` emerald (go), default gunmetal, `danger` red.
  Reserved: warning orange, refine cyan, chaos amber, instruct pink — reach
  for these before inventing colors.
- **Icon buttons** (32–44px gunmetal squares): hover flips to solid cyan +
  dark glyph + glow; red variant for delete. Row ✎ buttons, table
  buttons, jump pill follow this.
- **Actions** (ex-⋯ menu, now a static block atop the sidebar): Card
  (Edit, Regenerate, Clear story), Table (Shuffle, Clear table), Data
  (Share, Export, Import, Restore). No trigger, no dropdown — always
  visible; destructive rows arm in place.
- **Table slots**: full-width chalk rows, 3px type-colored edge, avatar +
  name + type, ✕ on hover, rotation badge for speakers, one dashed empty
  hint. Always expanded — no collapse toggle.
- **Entity rows** (peer, character, deck): one anatomy — 40px avatar,
  zero row inset, 10px gap; the 1px row border sets the column (icons at
  section inset + 1px, peer row carries a matching 1px). Icon and text
  columns align across all three groups. Never rely on browser default
  button padding; always declare row padding explicitly (even when 0).
- **Bubbles**: user = solid emerald, bottom-right corner cut; character =
  glass + hairline border, bottom-left cut, mono speaker label above;
  system = dashed outline, centered, muted. Thoughts collapse into
  `<details>` above the bubble. Tools (copy/delete) reveal on hover.
- **Composer**: ☰ + autogrowing well + ■-while-busy + Send; placeholder
  names the next speaker. Enter sends, Shift+Enter breaks.
- **Status**: one mono line (`~tokens / budget · cards · msgs`), detail in
  `title` tooltip. Busy state reuses the line (label + dots).
- **Dialogs/toasts**: fixed overlay `rgba(void,.7)` + blur, chalk card,
  14px radius, Ubuntu title, mono id line; toasts bottom-center, cyan edge,
  auto-dismiss.
- **Editor**: type dropdown unlocks fields; bracket textareas carry live
  key-count hints; "Play on the table" checkbox; starters save as copies.

## 7. Voice contract

- Chrome: clinical, verb-first, 1–2 words ("Send", "Shuffle", "Clear story"
  → "Sure?"). One canonical verb per action — never two labels for one
  intent. Placeholders teach ("Reply to Chloe..."). Errors say what to do
  next, never just what broke.
- Story: warm, playful, theatrical (Banter, "Drew: X + Y."). Emoji belong
  to the story and avatars — never to system chrome.
- Destructive actions arm ("Sure?", 2.6s window), never modal.

## 8. Restraint budget (the minimalism engine)

1. **Main column carries two things**: scene + stage door. Everything else
   must justify its pixels or move to the sidebar/Menu.
2. **Eyebrow budget**: max one mono-caps header per panel group; content
   should categorize itself before earning a label.
3. **No filler**: a grid holds exactly its content — never empty tiles to
   balance a layout (one dashed empty-table hint, not six dead slots… next).
4. **No repetition**: adjacent sections must not share identical structure
   without reason; vary stack / split / tabular row.
5. **Progressive disclosure**: hover-reveals, collapsibles, tooltips, and
   the Menu absorb everything used less than daily.

## 9. Immersion techniques (the innovative layer)

- **Presence over panels**: speaker labels, rotation badges, typing
  presence, and the next-speaker placeholder keep the cast alive without a
  single settings screen.
- **Scene captions**: the status line reads as a caption of the fiction's
  cost (`~199 / 6k`), not a dashboard — detail hides in tooltips. When the
  table is empty it earns its place differently (`9 cards in the library`)
  instead of repeating the peer box.
- **Staging disclosure**: `<think>` thoughts collapse by default (process
  is backstage); the 🎬 mode line signals 2-shot nights like house lights.
- **Signature color (next)**: one persistent hue per entity across slots,
  badges, and labels — rpglitch's signature registry, adopted for cast
  tracking at a glance.
- **Satisfy accent (next)**: a single handwritten brand moment (empty-state
  title or share card) — the family's unused differentiator.

## 10. Conformance (this generator)

Matching: font trio + roles, palette names/values, void gradient, glass
chassis, 8/14 radii, physics motion, press-sink, button variants +
icon-flip, italic placeholders, cyan focus, hover tools, pulse loading,
arm-to-confirm, mono status, menu-as-dropdown, `100dvh`, dark-only,
tinted shadows, tabular numerals on live counts, single empty-table hint,
cyan focus rings on every control including menu/tool/✕ buttons.
Deliberate deltas: `--muted` for secondary text; emerald user bubbles
(the family has no chat); dual voice (clinical chrome, playful story).
Adopt next: eyebrow budget, signature colors, Satisfy moment.

## 11. Change protocol (governance-lite)

1. Tokens change here first, in code second. Never a raw hex in a patch.
2. New components arrive with: role (which section), elevation (which
   glass), motion (which verb), voice (which half of the contract).
3. Run the audit before shipping UI work: accent lock intact? eyebrow
   budget kept? main column still two things? exits instant? one verb per
   action? placeholders italic, focus cyan, icon buttons labelled?

## 12. Provenance

- `imageglitch` (workspace `scratch/generators/imageglitch/`): the taste —
  tokens, fonts, radii, physics, button/menu/overlay patterns, playful voice.
- `rpglitch` (workspace `scratch/rpglitch-src/`, from
  `https://github.com/JooduG/RPGlitch`): the governance — token pipeline and
  4-tier architecture, glass elevations, grounded motion law, bits-ui
  headless patterns, motion standards, anti-slop taste doc, clinical voice.
