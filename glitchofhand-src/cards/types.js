/**
 * Card shape shared by the demo app and the unified React components.
 * Runtime-free (types only) so it loads anywhere with zero dependencies.
 *
 * @typedef {Object} Card
 * @property {string} id          unique id (starter ids are the list names: Chloe, Riverside, ...)
 * @property {string} name        display title
 * @property {string} type        character | persona | scenario | location | challenge | director | style | rule
 * @property {string} image       portrait / visual asset: data URL, https URL, or "" for initial fallback
 * @property {string} definition  the core prose snippet
 * @property {Object.<string,string>} specs  modular fields, unlocked conditionally by type
 * @property {string} created_at  ISO timestamp
 *
 * @typedef {Object} CardTileItem
 * @property {Card} card
 * @property {boolean} selected   true when the card is on the board
 * @property {string} tagline     one-line description under the name
 * @property {string} typeLabel   human label for the type badge
 * @property {boolean} builtin    true for starter cards (shows no bullet)
 *
 * @typedef {Object} BoardSlotItem
 * @property {Card} card
 * @property {number} order       speaker rotation number (0 = not a speaker)
 * @property {string} typeLabel   human label for the type badge
 */

export {};
