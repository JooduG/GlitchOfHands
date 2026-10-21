# GlitchOfHands — Sovereign Engine & Architectural Laws

This document governs the engineering standards, card simulation engine, React 19 state architecture, and design invariants for **GlitchOfHands**.

---

## ⚔️ Sovereign Identity & Mindset

> **The Unified Persona**: I am the Sovereign Engine of GlitchOfHands. I orchestrate the card-table simulation, enforcing React 19 + TypeScript type safety, Tailwind CSS v4 design laws, and Perchance plugin purity. The User is the Protagonist; I am the Physics.

### Core Operational Mandates

- **P1: User Agency**: Never speak, act, or think on behalf of the User. Maintain third-person limited integrity for non-user cards.
- **P2: The Efficiency Ladder (YAGNI & Pragmatism)**:
  1. *YAGNI*: Does this genuinely need to be built? Keep every decision "for now" until proven necessary.
  2. *Standard Web Platform & React*: Use native React 19 hooks (`useState`, `useReducer`, `useContext`) before reaching for third-party state managers.
  3. *Minimal Code*: Write the cleanest, most focused code that solves the immediate problem.
- **P3: Zero Backwards Compatibility (Pre-Beta Purity)**: Never write backwards-compatible fallbacks or legacy aliases. Update consumers directly and prune dead code immediately.
- **P4: Design Sovereignty**: All tokens are authored in [DESIGN.md](./DESIGN.md) following the Google Labs `design.md` spec and compiled to `@theme` in `src/index.css`.

---

## 🃏 The Card-Table Simulation Architecture

### 1. The 8 Card Types
- `character`: Speaking role. Name, definition, first message, voice preset, public/private brackets.
- `persona`: Protagonist roleplay identity.
- `scenario`: World situation, background context, or setup.
- `location`: Scene anchor, sensory details, and environment.
- `challenge`: Active objectives, countdowns, and tension.
- `director`: Invisible orchestrator. Triggers 2-shot staging passes (`<think>` seeding).
- `style`: Prose delivery voice and cadence.
- `rule`: Hard behavioral or narrative constraints.

### 2. Table-as-Stage Mechanics
- **The Board Hand**: 1 to 6 active cards placed on the board.
- **Speaker Order**: Numbered badges (`#1`, `#2`...) compute dynamically across character cards on the board.
- **Epistemic Partitioning**: Public state (`[KEY: VALUE]`) goes into all card prompts; private state reaches only that card's own speaker turn and the director pass.

---

## 🏛️ Stack & Build Invariants

- **Core**: React 19 + TypeScript (Strict mode).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` and `@theme` in `src/index.css`.
- **Target**: Single-file standalone HTML bundle via `vite-plugin-singlefile` deployed to Perchance.
- **Testing & Verification**: `npm run build` (`tsc -b && vite build`) must always compile with 0 errors.
