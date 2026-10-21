/**
 * .agents/skills/design/scripts/sync-classes.js
 * 🔍 HARDCODED-CLASS HUNTER — replaces hardcoded color values with DESIGN.md tokens
 *
 * Hunts src/** for hardcoded Tailwind color values and rewrites them to the
 * canonical @theme token classes compiled by sync-css.js:
 *
 *   text-[#8b93a1]            → text-muted
 *   bg-[#05060a]/80            → bg-void/80
 *   border-[#363840]           → border-gunmetal
 *   hover:bg-[#ef4444]/10      → hover:bg-danger/10
 *   bg-[rgba(17,174,204,0.12)] → bg-cyan/12        (whole-value rgba only)
 *   from-[#0b101a]             → from-background-gradient-1
 *
 * Token map is derived at runtime from DESIGN.md frontmatter `colors:`
 * (key `color-muted` → utility infix `muted`, mirroring sync-css.js), so
 * adding/renaming a token automatically changes what the hunter targets.
 * Non-color arbitrary values (text-[10px], w-32, …) are never touched, and
 * compound values like shadow-[0_0_12px_rgba(…)] are left alone and reported
 * as leftovers for manual judgment.
 *
 * Usage:
 *   node .agents/skills/design/scripts/sync-classes.js            # rewrite in place + report
 *   node .agents/skills/design/scripts/sync-classes.js --dry-run  # report only, change nothing
 *   node .agents/skills/design/scripts/sync-classes.js --check    # exit 1 if hardcoded remain (CI)
 *   node .agents/skills/design/scripts/sync-classes.js --path src/components  # limit scope
 *
 * Wire-up (package.json):
 *   "sync:classes": "node .agents/skills/design/scripts/sync-classes.js",
 *   "lint:classes": "node .agents/skills/design/scripts/sync-classes.js --check",
 *   "sync": "npm run sync:ignores && npm run sync:css && npm run sync:classes"
 * Run sync:css BEFORE sync:classes so brand-new tokens exist before classes
 * are rewritten to use them.
 */

import fs from 'fs'
import path from 'path'
import * as yaml from 'js-yaml'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../../../')
const designMdPath = path.join(rootDir, 'DESIGN.md')

// Tailwind utilities that carry a color. A prefix counts when it equals one
// of these or extends one with a dash suffix (border-x, ring-offset-* …).
const COLOR_PREFIXES = new Set([
  'text',
  'bg',
  'border',
  'ring',
  'ring-offset',
  'decoration',
  'placeholder',
  'fill',
  'stroke',
  'caret',
  'divide',
  'outline',
  'accent',
  'from',
  'via',
  'to',
  'shadow',
])

function prefixIsColor(prefix) {
  if (COLOR_PREFIXES.has(prefix)) return true
  for (const base of COLOR_PREFIXES) {
    if (prefix.startsWith(base + '-')) return true
  }
  return false
}

function normHex(raw) {
  let h = String(raw || '')
    .trim()
    .replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h
    .split('')
    .map((c) => c + c)
    .join('')
  return h.toLowerCase()
}

/** { hex: {hex6: token}, rgb: {"r,g,b": token} } from DESIGN.md frontmatter. */
export function loadTokenMaps(designMdText) {
  const parts = String(designMdText || '').split(/^---$/m)
  if (parts.length < 3) throw new Error('Invalid YAML frontmatter in DESIGN.md.')
  const frontmatter = yaml.load(parts[1]) || {}
  const colors = frontmatter.colors || {}
  const hex = {}
  const rgb = {}
  for (const [key, value] of Object.entries(colors)) {
    const token = String(key).replace(/^color-/, '')
    const h = normHex(String(value))
    if (!/^[0-9a-f]{6}$/.test(h)) continue
    hex[h] = token
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    rgb[`${r},${g},${b}`] = token
  }
  return { hex, rgb }
}

/**
 * Rewrite hardcoded color classes in one file's text.
 * Returns { text, count, leftovers } where leftovers are line-hits that
 * still contain color-like arbitrary values (unknown hexes, rgba inside
 * compound values such as shadows) for manual review.
 */
export function replaceClasses(text, maps) {
  let count = 0
  const HEX_RE =
    /([A-Za-z][A-Za-z0-9-]*)-\[#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\](\/\d+(?:\.\d+)?)?/g
  const RGBA_RE =
    /([A-Za-z][A-Za-z0-9-]*)-\[((?:rgba?)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\))(\/\d+(?:\.\d+)?)?\]/g

  let out = String(text || '').replace(
    HEX_RE,
    (m, prefix, hex6, alpha8, op) => {
      if (!prefixIsColor(prefix)) return m
      const token = maps.hex[String(hex6).toLowerCase()]
      if (!token) return m
      let suffix = op || ''
      if (alpha8 && !op) {
        const pct = Math.round((parseInt(alpha8, 16) / 255) * 100)
        suffix = '/' + pct
      }
      count++
      return `${prefix}-${token}${suffix}`
    },
  )

  out = out.replace(RGBA_RE, (m, prefix, _fn, r, g, b, a, op) => {
    if (!prefixIsColor(prefix)) return m
    const token = maps.rgb[`${Number(r)},${Number(g)},${Number(b)}`]
    if (!token) return m
    let suffix = op || ''
    if (a !== undefined && !op) {
      const pct = Math.round(parseFloat(a) * 100)
      if (Math.abs(parseFloat(a) * 100 - pct) > 0.01) return m
      suffix = '/' + pct
    }
    count++
    return `${prefix}-${token}${suffix}`
  })

  const leftovers = []
  const lines = out.split('\n')
  const LEFT_RE = /-\[#[0-9a-fA-F]{6,8}\]|-\[rgba?\(/
  for (let i = 0; i < lines.length; i++) {
    if (LEFT_RE.test(lines[i])) {
      const m = lines[i].match(/-\[#[0-9a-fA-F]{6,8}\]|-\[rgba?\([^\]]*/)
      leftovers.push(`${i + 1}: ${(m && m[0]) || 'color value'} — ${lines[i].trim().slice(0, 100)}`)
    }
  }
  return { text: out, count, leftovers }
}

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const SKIP_FILES = new Set(['src/index.css'])

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      walk(full, files)
    } else if (SCAN_EXTS.has(path.extname(entry.name))) {
      const rel = path.relative(rootDir, full).replace(/\\/g, '/')
      if (SKIP_FILES.has(rel)) continue
      files.push(full)
    }
  }
  return files
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const check = args.includes('--check')
  const pathIdx = args.indexOf('--path')
  const scopeDir = pathIdx >= 0 && args[pathIdx + 1]
    ? path.resolve(rootDir, args[pathIdx + 1])
    : path.join(rootDir, 'src')

  if (!fs.existsSync(designMdPath)) {
    console.error('[sync-classes] DESIGN.md not found.')
    process.exit(1)
  }
  const maps = loadTokenMaps(fs.readFileSync(designMdPath, 'utf8'))
  const tokenCount = Object.keys(maps.hex).length
  if (!tokenCount) {
    console.error('[sync-classes] No colors found in DESIGN.md frontmatter.')
    process.exit(1)
  }

  if (!fs.existsSync(scopeDir)) {
    console.error(`[sync-classes] Scope directory not found: ${scopeDir}`)
    process.exit(1)
  }

  const files = walk(scopeDir, [])
  let changedFiles = 0
  let total = 0
  const leftoverReport = []

  for (const full of files) {
    const rel = path.relative(rootDir, full).replace(/\\/g, '/')
    const original = fs.readFileSync(full, 'utf8')
    const { text, count, leftovers } = replaceClasses(original, maps)
    if (count > 0) {
      changedFiles++
      total += count
      if (!dryRun && !check) fs.writeFileSync(full, text, 'utf8')
      console.log(`  ✓ ${rel}: ${count} replacement${count === 1 ? '' : 's'}`)
    }
    for (const l of leftovers) leftoverReport.push(`${rel}:${l}`)
  }

  console.log(
    `[sync-classes] ${tokenCount} tokens → ${total} replacement${total === 1 ? '' : 's'} in ${changedFiles} file${changedFiles === 1 ? '' : 's'}${dryRun ? ' (dry run, nothing written)' : ''}`,
  )
  if (leftoverReport.length) {
    console.log('[sync-classes] Leftovers needing manual judgment (unknown hexes, rgba inside compound values like shadows):')
    for (const l of leftoverReport.slice(0, 60)) console.log(`    ${l}`)
    if (leftoverReport.length > 60) console.log(`    … +${leftoverReport.length - 60} more`)
  }

  if (check && (total > 0 || leftoverReport.length > 0)) {
    console.error('[sync-classes] Hardcoded color values remain. Run sync:classes, then re-check.')
    process.exit(1)
  }
}

const invokedAsScript =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedAsScript) main()

/**
 * CHANGELOG:
 * - 2026-10-21: Created — DESIGN.md-driven hardcoded-class hunter (hex, 8-digit hex, whole-value rgba; dry-run/check/scope flags).
 */
