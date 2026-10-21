---
name: GlitchOfHands
version: alpha
colors:
  color-background-gradient-1: "#0b101a"
  color-background-gradient-2: "#14182b"
  color-background-gradient-3: "#1e1b38"
  color-background-gradient-4: "#16243b"
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
  color-orange: "#f97316"
  color-rose: "#fb7185"
  color-indigo: "#818cf8"
  color-violet: "#c084fc"
  color-teal: "#14b8a6"
  color-lime: "#84cc16"
  color-yellow: "#fde047"
typography:
  font-base: '"Inter", sans-serif'
  font-heading: '"Ubuntu", sans-serif'
  font-mono: '"JetBrains Mono", monospace'
rounded:
  radius-sharp: 8px
  radius-standard: 14px
spacing:
  spacing-pixel: 1px
  spacing-unit: 0.25rem
components:
  glass-chassis: rgba(54, 56, 64, 0.5)
  glass-sunken: rgba(5, 6, 10, 0.5)
  glass-elevated: rgba(242, 247, 250, 0.06)
  glass-peak: "#191b21"
  physics-curve: cubic-bezier(0.4, 0, 0.2, 1)
  duration-fast: 150ms
  duration-standard: 300ms
  scale-press: "0.97"
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
    background: linear-gradient(
      120deg,
      var(--color-background-gradient-1) 0%,
      var(--color-background-gradient-2) 40%,
      var(--color-background-gradient-3) 70%,
      var(--color-background-gradient-4) 100%
    ) no-repeat fixed;
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


