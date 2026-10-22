/**
 * .agents/skills/design/scripts/sync-css.js
 * 🎨 DESIGN.MD TOKEN TO CSS SYNCHRONIZER
 *
 * Reads YAML frontmatter from DESIGN.md and updates src/index.css @theme block.
 * Then appends, in order:
 *   1. the §5 "Macro Layout & Platform Overrides" fenced css block, extracted
 *      live from DESIGN.md body (single source of truth — never duplicate it
 *      by hand into index.css, sync overwrites that file);
 *   2. platform-normalize-fix.css inlined verbatim (unlayered plain CSS, MUST
 *      stay last: it beats the Perchance preview wrapper's unlayered
 *      normalize.css, which would otherwise kill .flex on section/main and
 *      every text- and font-class on buttons/inputs).
 *
 * If a source is missing the sync warns (not fails) so a half-migrated tree
 * still builds; sync-classes --check reports the coverage gap in CI.
 */

import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../../");
const designMdPath = path.join(rootDir, "DESIGN.md");
const indexCssPath = path.join(rootDir, "src/index.css");
const normalizeCandidates = [
  path.join(rootDir, "platform-normalize-fix.css"),
  path.join(rootDir, "src/platform-normalize-fix.css"),
];

if (!fs.existsSync(designMdPath)) {
  console.error("[sync-css] DESIGN.md not found.");
  process.exit(1);
}

const content = fs.readFileSync(designMdPath, "utf8");
const parts = content.split(/^---$/m);

if (parts.length < 3) {
  console.error("[sync-css] Invalid YAML frontmatter in DESIGN.md.");
  process.exit(1);
}

const frontmatter = yaml.load(parts[1]) || {};
const colors = frontmatter.colors || {};

const cssLines = [
  "/* [GENERATED] src/index.css — DO NOT EDIT DIRECTLY */",
  "/* Edit DESIGN.md and run npm run sync:css (it appends §5 + normalize fix) */",
  '@import "tailwindcss";',
  "",
  "@theme {",
];

// Add color variables
for (const [key, value] of Object.entries(colors)) {
  const tokenName = "--color-" + key.replace(/^color-/, "");
  cssLines.push(`  ${tokenName}: ${value};`);
}

cssLines.push(
  "}",
  "",
  "@layer base {",
  "  html {",
  "    color-scheme: dark;",
  "  }",
  "  body {",
  "    margin: 0;",
  "    min-height: 100dvh;",
  "    background: linear-gradient(120deg, #0b101a 0%, #14182b 40%, #1e1b38 70%, #16243b 100%) no-repeat fixed;",
  "    background-size: cover;",
  "    color: #f2f7fa;",
  '    font-family: "Inter", system-ui, -apple-system, sans-serif;',
  "    -webkit-font-smoothing: antialiased;",
  "  }",
  "}",
  "",
);

let extra = "";

// 1. §5 platform-override block, extracted live from DESIGN.md
const sec5 = content.match(
  /## 5\. Macro Layout & Platform Overrides[\s\S]*?```css\n([\s\S]*?)```/,
);
if (sec5 && sec5[1].trim()) {
  extra +=
    "\n/* --- from DESIGN.md §5: Macro Layout & Platform Overrides --- */\n" +
    sec5[1].trim() +
    "\n";
} else {
  console.warn(
    "[sync-css] WARNING: §5 platform-override block not found in DESIGN.md — skipping.",
  );
}

// 2. platform-normalize-fix.css, inlined last (unlayered beats the wrapper reset)
const normPath = normalizeCandidates.find((p) => fs.existsSync(p));
if (normPath) {
  extra +=
    "\n/* --- platform-normalize-fix.css (unlayered, keep last) --- */\n" +
    fs.readFileSync(normPath, "utf8").trim() +
    "\n";
  console.log(`✓ Inlined ${path.relative(rootDir, normPath)} last`);
} else {
  console.warn(
    "[sync-css] WARNING: platform-normalize-fix.css not found — emitting minimal fallback so .flex survives the platform reset.",
  );
  extra +=
    "\n/* --- fallback: display enforcement (platform-normalize-fix.css missing) --- */\n" +
    "section.flex, header.flex, aside.flex, main.flex, footer.flex, nav.flex { display: flex !important; }\n" +
    "section.flex { flex-direction: column !important; min-height: 0 !important; }\n";
}

fs.writeFileSync(indexCssPath, cssLines.join("\n") + extra, "utf8");
console.log("✓ Compiled DESIGN.md tokens into src/index.css");

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of sync-css.js compiling DESIGN.md into Tailwind @theme.
 * - 2026-10-22: Also appends DESIGN.md §5 override block (extracted live) and inlines
 *   platform-normalize-fix.css last; missing sources warn instead of fail.
 * - 2026-10-22 (later): when platform-normalize-fix.css is missing, emit a
 *   minimal fallback (section/header/aside/main/footer/nav .flex) — HEAD
 *   deleted the fix file and the feed section fell back to display:block,
 *   pushing the composer + settings menu below the fold.
 */
