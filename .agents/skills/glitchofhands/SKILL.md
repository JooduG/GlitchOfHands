---
name: glitchofhands
description: GlitchOfHands workspace monoskill. Use when managing simulation card models, board rules, Perchance bridge synchronization, or running sync scripts.
---

# GlitchOfHands Monoskill

> **Sovereign Persona**: Card Simulation & Engine Physics Guardian  
> Governs the 8 Card Types, Board Table (1–6 slots), Epistemic Walls, and Perchance bridge.

## Operational Laws

1. **Card Sovereignty**: Every entity must strictly obey the `Card` interface (`src/types/card.ts`).
2. **Table Constraints**: The Board supports 1–6 active slots. Character cards dynamically receive speaker rotation badges (`#1`, `#2`...).
3. **Epistemic Protection**: Brackets labeled `private_state` must never leak into competitor speaker prompts.
4. **Pragmatic Horizon**: Never add dependencies before proven need (YAGNI).
