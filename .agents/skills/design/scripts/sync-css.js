/**
 * .agents/skills/design/scripts/sync-css.js
 * 🎨 DESIGN.MD TOKEN TO CSS SYNCHRONIZER
 *
 * Reads YAML frontmatter from DESIGN.md and updates src/index.css @theme block.
 */

import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../../");
const designMdPath = path.join(rootDir, "DESIGN.md");
const indexCssPath = path.join(rootDir, "src/index.css");

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
const body = parts.slice(2).join("---").trim();

const cssLines = [
  "/* [GENERATED] src/index.css — DO NOT EDIT TOKENS DIRECTLY */",
  "/* Edit DESIGN.md and run npm run sync:css */",
  '@import "tailwindcss";',
  "",
  "@theme {",
];

const categories = ["colors", "typography", "rounded", "spacing", "components"];

for (const cat of categories) {
  const tokens = frontmatter[cat] || {};
  if (Object.keys(tokens).length > 0) {
    cssLines.push(`  /* --- ${cat.toUpperCase()} --- */`);
    for (const [key, value] of Object.entries(tokens)) {
      const tokenName = key.startsWith("--")
        ? key
        : `--${key.replace(/^(color|font|radius|spacing)-/, "$1-")}`;
      cssLines.push(`  ${tokenName}: ${value};`);
    }
  }
}

cssLines.push("}", "");

// Append any markdown ```css ... ``` blocks from DESIGN.md (Single Source of Truth)
const cssBlocks = [...body.matchAll(/```css([\s\S]*?)```/g)]
  .map((m) => m[1].trim())
  .join("\n\n");

if (cssBlocks) {
  // Hoist @import statements above everything else (CSS specification requires @import at the very top)
  const imports = [];
  const otherRules = [];
  for (const block of cssBlocks.split("\n\n")) {
    if (block.trim().startsWith("@import")) {
      imports.push(block.trim());
    } else {
      otherRules.push(block.trim());
    }
  }

  if (imports.length > 0) {
    // Insert before @import "tailwindcss"; (index 2)
    cssLines.splice(2, 0, ...imports, "");
  }
  if (otherRules.length > 0) {
    cssLines.push(...otherRules, "");
  }
}

fs.writeFileSync(indexCssPath, cssLines.join("\n"), "utf8");
console.log("✓ Compiled DESIGN.md tokens & CSS rules into src/index.css");

/**
 * CHANGELOG:
 * - 2026-10-21: Extract CSS blocks from DESIGN.md body dynamically with @import hoisting (matching RPGlitch pattern).
 * - 2026-10-21: Initial creation of sync-css.js compiling DESIGN.md into Tailwind @theme.
 */
