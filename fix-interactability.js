/**
 * fix-interactability.js — one-shot fixer for the composer sinkhole + touch tools.
 *
 * Run from the repo root:  node fix-interactability.js
 *
 * What it does (exact string replacements across src/`**`/*.tsx|ts|jsx|js):
 *   1. feed <section>  += min-h-0   (section refused to shrink; composer sank
 *      below the fold as the story grew and became clipped/dead)
 *   2. message scroll list += min-h-0 (belt & suspenders: list must scroll
 *      internally instead of growing)
 *   3. message copy/delete tools += [@media(hover:none)]:flex focus-within:flex
 *      (tools were display:none until group-hover, so touch devices and
 *      keyboard users could never reach them)
 *
 * Idempotent: re-running changes nothing. Exits 1 if any pattern is not
 * found, so you know immediately if your components drifted from these
 * strings (see INTERACTABILITY_FIX.md for the manual fallback).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(rootDir, 'src')

const FIXES = [
  {
    label: 'feed section min-h-0',
    from: 'flex flex-1 flex-col overflow-hidden p-4 md:p-6 relative',
    to: 'flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6 relative',
  },
  {
    label: 'scroll list min-h-0',
    from: 'flex-1 overflow-y-auto space-y-3 pr-1',
    to: 'flex min-h-0 flex-1 overflow-y-auto space-y-3 pr-1',
  },
  {
    label: 'touch/keyboard message tools',
    from: 'hidden gap-1 group-hover:flex',
    to: 'hidden gap-1 group-hover:flex [@media(hover:none)]:flex focus-within:flex',
  },
]

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      walk(full, files)
    } else if (SCAN_EXTS.has(path.extname(entry.name))) {
      files.push(full)
    }
  }
  return files
}

const hits = FIXES.map(() => 0)
let changedFiles = 0

for (const full of walk(srcDir, [])) {
  const rel = path.relative(rootDir, full).replace(/\\/g, '/')
  const original = fs.readFileSync(full, 'utf8')
  let text = original
  FIXES.forEach((fix, i) => {
    const n = text.split(fix.from).length - 1
    if (n > 0) {
      // don't double-apply on re-runs
      const alreadyFixed = text.split(fix.to).length - 1
      const pending = n - alreadyFixed
      if (pending > 0) {
        text = text.split(fix.from).join(fix.to)
        hits[i] += pending
      } else {
        hits[i] += 0
      }
    }
  })
  if (text !== original) {
    fs.writeFileSync(full, text, 'utf8')
    changedFiles++
    console.log(`  ✓ ${rel}`)
  }
}

console.log('[fix-interactability] results:')
let failed = false
FIXES.forEach((fix, i) => {
  console.log(`    ${fix.label}: ${hits[i]} replacement${hits[i] === 1 ? '' : 's'}`)
  if (hits[i] === 0) {
    console.error(`    !! pattern not found: "${fix.from}" — see INTERACTABILITY_FIX.md`)
    failed = true
  }
})
console.log(`[fix-interactability] ${changedFiles} file${changedFiles === 1 ? '' : 's'} changed.`)
if (failed) process.exit(1)
console.log('[fix-interactability] Done. Run npm run build, verify, paste dist into Perchance.')

/**
 * CHANGELOG:
 * - 2026-10-21: Created — composer sinkhole (2× min-h-0) + touch/keyboard tools fix.
 */
