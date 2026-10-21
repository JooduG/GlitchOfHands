/**
 * src/types/perchance.d.ts
 * 🌐 PERCHANCE AMBIENT RUNTIME INTERFACES
 *
 * Ambient declarations for Perchance window plugins and global root namespace.
 */

declare global {
  interface Window {
    generatorName?: string
    root?: {
      generateText?: (prompt: string | { prompt: string; [key: string]: unknown }) => Promise<string | { text: string; [key: string]: unknown }>
      generateImage?: (prompt: string | { prompt: string; [key: string]: unknown }) => Promise<{ dataUrl?: string; [key: string]: unknown }>
      kv?: {
        get?: (key: string) => Promise<unknown>
        set?: (key: string, value: unknown) => Promise<void>
        list?: () => Promise<string[]>
        delete?: (key: string) => Promise<void>
      }
      chatPlugin?: {
        getCardTypes?: () => unknown[]
        getStarterCards?: () => unknown[]
        getStarterCardById?: (id: string) => unknown
        [key: string]: unknown
      }
      [key: string]: unknown
    }
  }

  const root: Window['root']
}

export {}

/**
 * CHANGELOG:
 * - 2026-10-21: Initial creation of ambient Perchance plugin definitions.
 */
