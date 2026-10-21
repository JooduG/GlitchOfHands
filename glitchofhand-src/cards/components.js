/**
 * Unified card component family (React + htm, zero build).
 *
 * One renderer for every card surface: binder rows, board slots, avatars,
 * type badges. Styling is Tailwind utilities mapped to the glitch tokens
 * (see tailwind.config in index.html); no legacy class names in here, so
 * these components own their visuals outright.
 *
 * Props are plain data + callbacks; all state lives in the demo app and
 * flows back in through renderCardList / renderBoardSlots.
 */
import React from "https://esm.sh/react@19.1.0";
import htm from "https://esm.sh/htm@3.1.1";
import { createRoot } from "https://esm.sh/react-dom@19.1.0/client";

const html = htm.bind(React.createElement);

/** @typedef {import("./types.js").Card} Card */

const TYPE_DOT = {
  character: "#11aecc",
  persona: "#ec4899",
  scenario: "#3b82f6",
  location: "#10b981",
  challenge: "#ef4444",
  director: "#fbbf24",
  style: "#a855f7",
  rule: "#8b93a1",
};

const TYPE_EDGE = {
  character: "#11aecc",
  persona: "#ec4899",
  scenario: "#3b82f6",
  location: "#10b981",
  challenge: "#ef4444",
  director: "#fbbf24",
  style: "#a855f7",
  rule: "#8b93a1",
};

function initialOf(name) {
  const ch = String((name || "?").trim().charAt(0) || "?").toUpperCase();
  return ch;
}

/** Square avatar: image when present, initial letter otherwise. */
export function CardAvatar({ card }) {
  const img = card && card.image;
  return html`<div className="w-10 h-10 rounded-lg flex-none flex items-center justify-center overflow-hidden bg-[rgba(17,174,204,0.12)] font-ubuntu font-bold text-[18px] leading-none text-frisk">
    ${img
      ? html`<img src=${img} alt="" className="w-full h-full object-cover" />`
      : html`<span className="font-ubuntu font-bold text-frisk">${initialOf(card && card.name)}</span>`}
  </div>`;
}

/** Uppercase type pill with a colored dot. */
export function TypeBadge({ type, label }) {
  const dot = TYPE_DOT[type] || "#8b93a1";
  return html`<span className="inline-flex items-center gap-[6px] font-mono text-[10px] font-medium tracking-[0.08em] uppercase px-[9px] py-[3px] rounded-lg mt-[4px] bg-[rgba(5,6,10,0.5)] text-muted max-w-full whitespace-nowrap overflow-hidden">
    <i className="w-[7px] h-[7px] rounded-full flex-none" style=${{ background: dot }}></i>${label}
  </span>`;
}

/**
 * Binder row: avatar, name, type badge, tagline, Edit button.
 * @param {{card: Card, selected: boolean, tagline: string, typeLabel: string, builtin: boolean, onToggle: (id: string) => void, onEdit: (id: string) => void}} props
 */
export function CardTile({ card, selected, tagline, typeLabel, builtin, onToggle, onEdit }) {
  const cls =
    "flex items-center gap-[10px] w-full rounded-lg border border-solid p-0 text-left font-inter text-[14px] text-frisk cursor-pointer transition-colors " +
    (selected
      ? "border-[rgba(17,174,204,0.55)] bg-[rgba(17,174,204,0.13)] shadow-[0_0_8px_rgba(17,174,204,0.18)]"
      : "border-transparent bg-transparent hover:bg-gunmetal active:scale-[0.98]");
  const activate = () => onToggle(card.id);
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  };
  return html`<div role="button" tabIndex=${0} aria-label=${card.name + (selected ? " (on board)" : "")} className=${cls} onClick=${activate} onKeyDown=${onKeyDown}>
    <${CardAvatar} card=${card} />
    <div className="min-w-0 flex-1">
      <b className="block text-[14px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">${card.name + (builtin ? "" : " \u2022")}</b>
      <${TypeBadge} type=${card.type} label=${typeLabel} />
      <span className="block text-[12px] text-muted whitespace-nowrap overflow-hidden text-ellipsis">${tagline}</span>
    </div>
    <button type="button" className="flex-none w-auto h-[28px] rounded-md border border-solid border-transparent bg-transparent text-frozen font-mono text-[10px] font-medium tracking-[0.08em] uppercase cursor-pointer leading-none px-[8px] inline-flex items-center justify-center transition-colors hover:bg-gunmetal hover:text-frisk" title=${"Edit " + card.name} aria-label=${"Edit " + card.name} onClick=${(e) => { e.stopPropagation(); onEdit(card.id); }}>Edit</button>
  </div>`;
}

/** One binder row list, or an empty-state note. */
export function CardList({ items, emptyText, onToggle, onEdit }) {
  if (!items.length) {
    return html`<div className="text-muted font-mono text-[12px] p-[10px] text-center">${emptyText}</div>`;
  }
  return html`${items.map((it) => html`<${CardTile} key=${it.card.id} card=${it.card} selected=${it.selected} tagline=${it.tagline} typeLabel=${it.typeLabel} builtin=${it.builtin} onToggle=${onToggle} onEdit=${onEdit} />`)}`;
}

/**
 * One board slot card.
 * @param {{card: Card, order: number, typeLabel: string, onOpen: (id: string) => void, onRemove: (id: string) => void}} props
 */
export function BoardSlot({ card, order, typeLabel, onOpen, onRemove }) {
  const open = () => onOpen(card.id);
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };
  return html`<div role="button" tabIndex=${0} title=${card.name + " (" + typeLabel + ") \u2014 click to inspect"} className="w-[132px] flex-none min-h-[168px] rounded-xl border border-solid border-[rgba(242,247,250,0.14)] border-t-[3px] border-t-[var(--edge)] p-[10px] flex flex-col gap-[8px] items-stretch min-w-0 cursor-pointer relative text-left bg-[rgba(242,247,250,0.06)] backdrop-blur-md shadow-[0_8px_24px_rgba(5,6,10,0.35)] hover:border-[#11aecc]" style=${{ "--edge": TYPE_EDGE[card.type] || "#11aecc" }} onClick=${open} onKeyDown=${onKeyDown}>
    <div className="flex items-center justify-between gap-[6px]">
      <span className="inline-flex items-center font-mono text-[10px] font-medium tracking-[0.08em] uppercase px-[8px] py-[3px] rounded-md bg-[rgba(5,6,10,0.5)] text-muted max-w-[calc(100%-28px)] whitespace-nowrap overflow-hidden text-ellipsis">${typeLabel}</span>
      <button type="button" className="border-none bg-transparent text-frozen cursor-pointer text-[13px] px-[4px] py-[2px] rounded-md flex-none hover:text-[#ef4444] hover:bg-gunmetal" title="Remove from board" aria-label=${"Remove " + card.name + " from board"} onClick=${(e) => { e.stopPropagation(); onRemove(card.id); }}>X</button>
    </div>
    <div className="h-[52px] rounded-lg bg-[rgba(17,174,204,0.08)] border border-solid border-[rgba(242,247,250,0.06)] flex items-center justify-center font-ubuntu font-bold text-[26px] text-frisk overflow-hidden">
      ${card.image
        ? html`<img src=${card.image} alt="" className="w-full h-full object-cover" />`
        : html`<span>${initialOf(card.name)}</span>`}
    </div>
    <div className="text-[13px] font-semibold leading-[1.3] line-clamp-2 overflow-hidden">${card.name}</div>
    ${order ? html`<span className="w-[18px] h-[18px] rounded-full bg-[#11aecc] text-[#05060a] font-mono text-[11px] font-bold tabular-nums flex items-center justify-center" title=${"Speaks #" + order + " in rotation"}>${order}</span>` : null}
  </div>`;
}

/** Dashed empty board slot. */
export function EmptySlot({ text }) {
  return html`<div className="flex-none w-[132px] min-h-[168px] border border-dashed border-frozen rounded-xl flex items-center justify-center font-mono text-[10px] tracking-[0.08em] uppercase text-frozen p-[10px] text-center">${text}</div>`;
}

/** Board hand plus at most one empty-slot filler. */
export function BoardSlots({ items, emptyText, onOpen, onRemove }) {
  return html`${items.map((it) => html`<${BoardSlot} key=${it.card.id} card=${it.card} order=${it.order} typeLabel=${it.typeLabel} onOpen=${onOpen} onRemove=${onRemove} />`)}${emptyText ? html`<${EmptySlot} text=${emptyText} />` : null}`;
}

const roots = new WeakMap();
function rootFor(el) {
  let r = roots.get(el);
  if (!r) {
    r = createRoot(el);
    roots.set(el, r);
  }
  return r;
}

/** Render the binder list into el (creates the React root on first call). */
export function renderCardList(el, props) {
  rootFor(el).render(html`<${CardList} items=${props.items} emptyText=${props.emptyText} onToggle=${props.onToggle} onEdit=${props.onEdit} />`);
}

/** Render the board hand into el (creates the React root on first call). */
export function renderBoardSlots(el, props) {
  rootFor(el).render(html`<${BoardSlots} items=${props.items} emptyText=${props.emptyText} onOpen=${props.onOpen} onRemove=${props.onRemove} />`);
}
