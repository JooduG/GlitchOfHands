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

// 3. Write .vscode/settings.json
if (master.vscode) {
  const vscodeDir = path.join(rootDir, '.vscode')
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true })
  }
  const settingsPath = path.join(vscodeDir, 'settings.json')
  let existingSettings = {}
  if (fs.existsSync(settingsPath)) {
    try {
      existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    } catch {
      existingSettings = {}
    }
  }
  const mergedSettings = { ...existingSettings, ...master.vscode }
  fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2) + '\n', 'utf8')
  console.log('✓ Synced .vscode/settings.json')
}

/**
 * CHANGELOG:
 * - 2026-10-21: Added VS Code settings generation from master.vscode.
 * - 2026-10-21: Initial creation of lean sync-ignores.js.
 */

