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
const colors = frontmatter.colors || {};

const cssLines = [
  "/* [GENERATED] src/index.css — DO NOT EDIT TOKENS DIRECTLY */",
  "/* Edit DESIGN.md and run npm run sync:css */",
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

fs.writeFileSync(indexCssPath, cssLines.join("\n"), "utf8");
console.log("✓ Compiled DESIGN.md tokens into src/index.css");

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of sync-css.js compiling DESIGN.md into Tailwind @theme.
 */
