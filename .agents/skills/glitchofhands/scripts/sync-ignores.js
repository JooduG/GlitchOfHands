/**
 * .agents/skills/glitchofhands/scripts/sync-ignores.js
 * 🌐 LEAN IGNORE SYNCHRONIZER
 *
 * Reads ignores.master.json and writes clean .gitignore and .geminiignore.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../../../')
const masterPath = path.join(rootDir, 'ignores.master.json')

if (!fs.existsSync(masterPath)) {
  console.error('[sync-ignores] ignores.master.json not found.')
  process.exit(1)
}

const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'))

// 1. Write .gitignore
const gitignoreContent = [
  '# Auto-generated from ignores.master.json — DO NOT EDIT DIRECTLY',
  ...(master.gitignore || []),
  '',
].join('\n')
fs.writeFileSync(path.join(rootDir, '.gitignore'), gitignoreContent, 'utf8')
console.log('✓ Synced .gitignore')

// 2. Write .geminiignore
const geminiContent = [
  '# Auto-generated from ignores.master.json — DO NOT EDIT DIRECTLY',
  ...(master.common || []),
  ...(master.geminiignore || []),
  '',
].join('\n')
fs.writeFileSync(path.join(rootDir, '.geminiignore'), geminiContent, 'utf8')
console.log('✓ Synced .geminiignore')

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of lean sync-ignores.js.
 */
