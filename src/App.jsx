import React, { useState } from 'react'
import TopOverlay from './components/TopOverlay'
import Silhouette from './components/Silhouette'
import ConversationLog from './components/ConversationLog'
import MicButton from './components/MicButton'
import DossierDrawer from './components/DossierDrawer'
import AccusationPanel from './components/AccusationPanel'
import useInterrogation from './hooks/useInterrogation'

export default function App() {
  const [dossierOpen, setDossierOpen] = useState(false)
  const [accusationOpen, setAccusationOpen] = useState(false)

  const {
    emotion,
    micState,
    messages,
    error,
    isUnlocked,
    collectedEvidence,
    sessionTime,
    phase,
    setPhase,
    handleMicClick,
  } = useInterrogation()

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col justify-between bg-background text-on-surface select-none">

      <div className="scanline-overlay" />
      <div className="grain-texture" />

      <div className="absolute top-24 left-12 w-32 h-32 border-l border-t border-surface-variant/30 pointer-events-none z-10" />
      <div className="absolute top-24 right-12 w-32 h-32 border-r border-t border-surface-variant/30 pointer-events-none z-10" />
      <div className="absolute bottom-32 left-12 w-32 h-32 border-l border-b border-surface-variant/30 pointer-events-none z-10" />
      <div className="absolute bottom-32 right-12 w-32 h-32 border-r border-b border-surface-variant/30 pointer-events-none z-10" />

      <aside className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <div className="font-label-sm text-label-sm vertical-rl rotate-180 flex gap-4 text-on-surface-variant">
          <span>COORD: 55.7558 N, 37.6173 E</span>
          <span>LEVEL: SUB-LEVEL 09</span>
          <span>O2: 18.4%</span>
        </div>
      </aside>

      <aside className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <div className="font-label-sm text-label-sm vertical-rl flex gap-4 text-on-surface-variant">
          <span>HEARTBEAT: 114 BPM</span>
          <span>STRESS: CRITICAL</span>
          <span>TRUTH_PROB: 34%</span>
        </div>
      </aside>

      <TopOverlay sessionTime={sessionTime} />
      <Silhouette emotion={emotion} />

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-primary-container/10 border border-primary-container px-4 py-2">
          <span className="font-label-bold text-label-bold text-primary-container">{error}</span>
        </div>
      )}

      <div className="flex flex-col">
        <ConversationLog messages={messages} />

        <footer className="relative z-50 p-gutter flex justify-between items-end border-t-2 border-surface-variant bg-surface-container-low/90">

          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => setDossierOpen(true)}
              className="w-16 h-16 flex items-center justify-center border-2 border-surface-variant hover:bg-surface-variant transition-all group"
            >
              <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-on-surface">
                folder
              </span>
            </button>
            <span className="font-label-bold text-label-sm text-on-surface-variant tracking-widest uppercase">
              DOSSIER
            </span>
          </div>

          <MicButton micState={micState} onClick={handleMicClick} />

          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => setAccusationOpen(true)}
              className={`w-16 h-16 flex items-center justify-center border-2 transition-all group ${
                isUnlocked
                  ? 'border-primary-container bg-primary-container/10 hover:bg-primary-container'
                  : 'border-surface-variant opacity-40'
              }`}
            >
              <span
                className={`material-symbols-outlined text-4xl ${
                  isUnlocked
                    ? 'text-primary-container group-hover:text-on-primary-container'
                    : 'text-on-surface-variant'
                }`}
              >
                target
              </span>
            </button>
            <span
              className={`font-label-bold text-label-sm tracking-widest uppercase ${
                isUnlocked ? 'text-primary-container' : 'text-on-surface-variant'
              }`}
            >
              ACCUSE
            </span>
          </div>
        </footer>
      </div>

      <DossierDrawer
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        evidence={collectedEvidence}
      />

      <AccusationPanel
        isOpen={accusationOpen}
        onClose={() => setAccusationOpen(false)}
        isUnlocked={isUnlocked}
        onAccuse={() => { setAccusationOpen(false); setPhase('victory') }}
      />
    </div>
  )
}
