# GlitchOfHands 🛸

> **AI character chat, roleplay, and multi-agent card simulation engine**  
> Powered by React 19, TypeScript, Tailwind CSS v4, and Perchance plugins (`ai-text-plugin`, `text-to-image-plugin`, `kv-plugin`).

Built using the principles from the *React + AI Stack for 2026*, designed for high type safety, clean component boundaries, and lean runtime overhead.

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
  id: string          // Unique ID (Chloe, Riverside, card_xxx...)
  name: string        // Display title
  type: CardType      // character | persona | scenario | location | challenge | director | style | rule
  image: string       // Portrait / visual asset: data URL, https URL, or "" for initial fallback
  definition: string  // Core prose snippet: appearance, tone, atmosphere, or rules
  specs: CardSpecs    // Modular fields unlocked conditionally by type
  created_at: string  // ISO timestamp
}
```

### 8 Card Types and Unlocked Fields

Defined once in `getCardTypes()` — the single source of truth:
- **`character`**: Speaking role. Unlocks `first_message`, `voice_preset`, `public_state`, `private_state`.
- **`persona`**: Protagonist roleplay identity.
- **`scenario`**: Situation, setup, or background context.
- **`location`**: Place and sensory anchor. Unlocks `visual_anchor`, `public_state`, `private_state`.
- **`challenge`**: Objectives and countdowns. Unlocks `public_state`, `private_state`.
- **`director`**: Invisible puppeteer. Triggers 2-shot staging passes (`<think>` seeding).
- **`style`**: Prose voice and literary cadence.
- **`rule`**: Hard constraints. Unlocks `enforcement` (`strict` | `guideline`), `public_state`, `private_state`.

### Epistemic Partitioning (Public & Private Brackets)

`public_state` and `private_state` are multiline `KEY: value` text.
- **Public brackets** go into every entity's prompt.
- **Private brackets** reach only the card's own speaker turn and the director staging pass — other characters never see them, preventing AI telepathy without regex hackery.

---

## Table-as-Stage Mechanics

- **The Hand (Table)**: 1 to 6 cards placed simultaneously on the board.
- **1 card on table**: Classic instant 1-on-1 chat.
- **2 cards (Character + Persona)**: Defined RPG (persona names the player in the transcript).
- **2+ Characters**: Group chat with rotating speaker turns (`thread.turn`) and Banter ("improvise without me").
- **Director Card on Table**: Switches turns to 2-shot: a hidden staging call seeds the speaker's `<think>` block, rendered as a collapsible thought stream.

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
