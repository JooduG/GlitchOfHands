import { useState } from 'react'

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'characters' | 'settings'>('chat')

  return (
    <div className="flex h-screen w-full flex-col bg-[#05060a]/90 text-[#f2f7fa]">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-[#363840]/60 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-[#11aecc] shadow-[0_0_10px_rgba(17,174,204,0.6)]" />
          <h1 className="text-lg font-bold tracking-tight text-[#f2f7fa]">
            GlitchOfHands
          </h1>
          <span className="rounded bg-[#191b21] px-2 py-0.5 text-xs font-mono text-[#8b93a1] border border-[#363840]">
            React + TS + Tailwind
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-[#191b21] text-[#11aecc] border border-[#11aecc]/40'
                : 'text-[#8b93a1] hover:text-[#f2f7fa]'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'characters'
                ? 'bg-[#191b21] text-[#11aecc] border border-[#11aecc]/40'
                : 'text-[#8b93a1] hover:text-[#f2f7fa]'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#191b21] text-[#11aecc] border border-[#11aecc]/40'
                : 'text-[#8b93a1] hover:text-[#f2f7fa]'
            }`}
          >
            Settings
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 overflow-hidden p-6 gap-6">
        <section className="flex flex-1 flex-col rounded-xl border border-[#363840]/60 bg-[#0b101a]/70 p-6 shadow-2xl backdrop-blur">
          <div className="mb-4 flex items-center justify-between border-b border-[#363840]/40 pb-3">
            <div>
              <h2 className="text-base font-semibold text-[#f2f7fa]">Ready for Blastoff</h2>
              <p className="text-xs text-[#8b93a1]">
                Perchance AI Text & Image Engine Bridge ready.
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#11aecc]/40 bg-[#11aecc]/10 shadow-[0_0_24px_rgba(17,174,204,0.2)]">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-lg font-medium text-[#f2f7fa]">
              GlitchOfHands Engine Ready
            </h3>
            <p className="mt-1 max-w-md text-sm text-[#8b93a1]">
              Equipped with React 19, TypeScript, Tailwind CSS, and single-file Perchance packaging.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

