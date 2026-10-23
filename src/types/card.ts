/**
 * src/types/card.ts
 * 🃏 CARD-TABLE DOMAIN SCHEMAS
 *
 * Single source of truth for GlitchOfHands Card Data Models, Spec Registry,
 * and Board/Binder Interfaces. Converted from glitchofhand-src/cards/types.js.
 */

export type CardType =
  | "character"
  | "persona"
  | "scenario"
  | "location"
  | "challenge"
  | "director"
  | "style"
  | "rule";

export interface CardSpecs {
  first_message?: string;
  greeting?: string;
  enforcement?: string;
  [key: string]: string | undefined;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  image: string;
  definition: string;
  specs: CardSpecs;
  created_at: string;
}

export interface CardTypeField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  atom?: string;
  control?: "text" | "textarea" | "select";
  readonly?: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface CardTypeDefinition {
  type: CardType;
  label: string;
  description: string;
  color: string;
  fields: CardTypeField[];
}

export const CARD_TYPE_REGISTRY: Record<CardType, CardTypeDefinition> = {
  character: {
    type: "character",
    label: "Character",
    description: "A speaking role. Name, definition, and first message.",
    color: "#11aecc",
    fields: [
      {
        key: "first_message",
        label: "First message",
        placeholder: "The first thing they say",
        multiline: true,
        atom: "textfield",
        control: "textarea",
      },
    ],
  },
  persona: {
    type: "persona",
    label: "Player Persona",
    description: "Who the user roleplays as. Name and definition only.",
    color: "#ec4899",
    fields: [],
  },
  scenario: {
    type: "scenario",
    label: "Scenario",
    description: "A situation or setup. Name and definition only.",
    color: "#3b82f6",
    fields: [],
  },
  location: {
    type: "location",
    label: "Location",
    description: "A place and sensory anchor. Name and definition only.",
    color: "#10b981",
    fields: [],
  },
  challenge: {
    type: "challenge",
    label: "Challenge",
    description: "A goal, countdown, or active tension.",
    color: "#ef4444",
    fields: [],
  },
  director: {
    type: "director",
    label: "Director",
    description: "Invisible puppeteer. Turns on 2-shot staging.",
    color: "#fbbf24",
    fields: [],
  },
  style: {
    type: "style",
    label: "Style",
    description: "Prose delivery voice and cadence.",
    color: "#a855f7",
    fields: [],
  },
  rule: {
    type: "rule",
    label: "Rule",
    description: "A hard behavioral or narrative constraint.",
    color: "#8b93a1",
    fields: [
      {
        key: "enforcement",
        label: "Enforcement",
        placeholder: "",
        atom: "dropdown",
        control: "select",
        options: ["strict", "guideline"],
        defaultValue: "strict",
      },
    ],
  },
};

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of card.ts domain types converted from glitchofhand-src/cards/types.js.
 */
