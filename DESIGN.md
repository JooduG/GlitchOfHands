---
name: GlitchOfHands
version: alpha
colors:
  # Primary action color (spec role). Alias of cyan per the accent lock:
  # cyan = presence/focus, emerald = go.
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
  # NOTE (2026-10-21, designmd-lint conformance): removed
  # color-background-gradient-1..4 and the spare accents
  # (orange/rose/indigo/violet/teal/lime/yellow). None were referenced by any
  # component, class, or stylesheet — the page gradient now lives composed as
  # backgrounds.app-gradient below, and the prose palette table never listed
  # the spares. Restore any of them here if a design starts consuming it.
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
  # Plain numbers and non-token strings on purpose: a millisecond string like
  # "150ms" or a hex value here would look like a design token to
  # 'designmd lint' (token-like-ignored) and warn as silently ignored.
  duration-fast: 150
  duration-standard: 300
  physics-curve: "cubic-bezier(0.4, 0, 0.2, 1)"
  scale-press: 0.97
backgrounds:
  app-gradient: "linear-gradient(120deg, #0b101a 0%, #14182b 40%, #1e1b38 70%, #16243b 100%)"
components:
  # Every color above is referenced here (orphaned-tokens). Only spec
  # sub-tokens are used (broken-ref). Pairs with both backgroundColor and
  # textColor are WCAG AA safe (contrast-ratio); single-prop entries skip it.
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
| `--primary`  | `#11aecc` | alias of cyan: primary action color          |

Background: 4-stop void gradient, `120deg`, fixed: `#0b101a → #14182b → #1e1b38 → #16243b`. Dark-only.

### Accent Lock (Minimalism Rule)

Two accents, non-overlapping jobs, never in the same pixel:

- **Cyan = presence.** Focus rings, active/equipped states, rotation badges, speaker labels, glow. Answers "where am I / who is on."
- **Emerald = go.** Send, Save, Banter, user bubbles. Answers "what moves the story forward."
- Card-type colors (pink/blue/green/red/amber/purple/grey) appear ONLY as 3px slot edges and type dots — never as fills, glows, or button colors.

## 3. Motion Grammar

One curve (`--physics: 150ms cubic-bezier(0.4,0,0.2,1)`), three verbs:

- **Hover = brighten** (`filter: brightness(1.2)`), never move.
- **Press = sink** (`scale(0.97)`), instant tactile answer on every pressable.
- **Enter = rise** (`translateY(8px)` + fade, 180ms); **exits are instant** (`display:none` toggles) — dismissals must never block the next action.

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
    background: linear-gradient(120deg, #0b101a 0%, #14182b 40%, #1e1b38 70%, #16243b 100%) no-repeat fixed;
    background-size: cover;
    color: var(--color-frisk);
    font-family: var(--font-base);
    -webkit-font-smoothing: antialiased;
  }
}

/* Layout enforcement against unlayered platform resets (e.g. Perchance iframe normalize.css) */
html, body, #root {
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
```


