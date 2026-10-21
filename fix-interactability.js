/**
 * fix-interactability.js (v2) — one-shot fixer for feed/composer interactability.
 *
 * Run from the repo root:  node fix-interactability.js
 *
 * Applies (exact string replacements across src/**):
 *   1. feed <section>  += min-h-0 (section refused to shrink; composer sank
 *      below the fold as the story grew and became clipped/dead)
 *   2. message scroll list += min-h-0 AND flex-col (v1 of this script added
 *      `flex` without `flex-col`, which flipped the feed onto a horizontal
 *      axis — bubbles in a sideways strip. v2 fixes both pre-v1 and
 *      post-v1 file states)
 *   3. message copy/delete tools += [@media(hover:none)]:flex
 *      focus-within:flex (tools were display:none until group-hover, so touch
 *      devices and keyboard users could never reach them)
 *   4. CHECKS for platform-normalize-fix.css (warning only — see below)
 *
 * Background on #4: the Perchance preview wrapper injects an UNLAYERED copy
 * of normalize.css v3 into <head> on every load. Unlayered author CSS beats
 * Tailwind v4's @layer utilities, so platform `section{display:block}` killed
 * `.flex` on <section>/<main> (composer sinkhole returned even WITH min-h-0
 * present) and platform `button{color:inherit}` killed every `text-*`
 * utility on <button> (skip chevron, cog and send glyph lost their colors).
 * The durable repo fix is platform-normalize-fix.css (shipped alongside this
 * script): import it AFTER everything else in your CSS entry so its
 * unlayered re-assertions win. The script only warns if it can't find it.
 *
 * Idempotent: already-fixed files are detected via the target string, so
 * re-running changes nothing. Exits 1 if a code fix is neither present nor
 * applicable (your components drifted — see INTERACTABILITY_FIX.md).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(rootDir, 'src')

const LIST_TARGET = 'flex min-h-0 flex-1 flex-col overflow-y-auto space-y-3 pr-1'

const FIXES = [
  {
    label: 'feed section min-h-0',
    to: 'flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6 relative',
    from: ['flex flex-1 flex-col overflow-hidden p-4 md:p-6 relative'],
  },
  {
    label: 'scroll list min-h-0 + flex-col (axis fix)',
    to: LIST_TARGET,
    // v1-output first (pristine pattern is a substring of it — order matters)
    from: [
      'flex min-h-0 flex-1 overflow-y-auto space-y-3 pr-1', // post-v1 state
      'flex-1 overflow-y-auto space-y-3 pr-1', // pristine state
    ],
  },
  {
    label: 'touch/keyboard message tools',
    to: 'hidden gap-1 group-hover:flex [@media(hover:none)]:flex focus-within:flex',
    from: ['hidden gap-1 group-hover:flex'],
  },
]

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])

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

const applied = FIXES.map(() => 0)
const alreadyOk = FIXES.map(() => 0)
const missing = FIXES.map(() => false)
let changedFiles = 0
let normalizeMarkerFound = false

for (const full of walk(srcDir, [])) {
  const rel = full.replace(rootDir + path.sep, '').replace(/\\/g, '/')
  const original = fs.readFileSync(full, 'utf8')
  if (original.includes('platform-normalize-fix')) normalizeMarkerFound = true
  let text = original
  FIXES.forEach((fix, i) => {
    if (text.includes(fix.to)) {
      alreadyOk[i]++
      return
    }
    for (const variant of fix.from) {
      const n = text.split(variant).length - 1
      if (n > 0) {
        text = text.split(variant).join(fix.to)
        applied[i] += n
        break // first matching variant wins; others are substrings/supersets
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
  if (applied[i] > 0) console.log(`    ${fix.label}: applied ${applied[i]}x`)
  else if (alreadyOk[i] > 0) console.log(`    ${fix.label}: already present`)
  else {
    console.error(`    !! ${fix.label}: NOT FOUND — see INTERACTABILITY_FIX.md`)
    missing[i] = true
    failed = true
  }
})
console.log(`[fix-interactability] ${changedFiles} file${changedFiles === 1 ? '' : 's'} changed.`)
if (!normalizeMarkerFound) {
  console.warn(
    '    !! platform-normalize-fix.css not referenced in src/ — copy it next to\n' +
      '       your CSS entry and import it LAST (it must stay unlayered plain CSS).\n' +
      '       Without it the Perchance wrapper reset re-breaks section flex +\n' +
      '       button colors on every paste. See INTERACTABILITY_FIX.md.'
  )
}
if (failed) process.exit(1)
console.log('[fix-interactability] Done. Run npm run build, verify, paste dist into Perchance.')

/**
 * CHANGELOG:
 * - 2026-10-21 (v1): composer sinkhole (2× min-h-0) + touch/keyboard tools fix.
 * - 2026-10-21 (v2): list fix now targets flex-col too (v1 flipped the feed
 *   horizontal); idempotent already-present detection; warns on missing
 *   platform-normalize-fix.css; scans .css as well.
 */
