import { useState } from 'react'
import TopOverlay, { SessionTimer } from './components/TopOverlay'
import Silhouette from './components/Silhouette'
import ConversationLog from './components/ConversationLog'
import InputBar from './components/InputBar'
import DossierDrawer from './components/DossierDrawer'
import IntroScreen from './components/IntroScreen'
import useInterrogation from './hooks/useInterrogation'
import DevPanel from './components/DevPanel'

export default function App() {
  const [dossierOpen, setDossierOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const {
    emotion,
    messages,
    error,
    collectedEvidence,
    sessionSeconds,
    phase,
    handleSubmit,
    onMicStart,
    testEmotion,
    startSession,
  } = useInterrogation()

  function handleBegin() {
    setShowIntro(false)
    startSession()
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col justify-between bg-background text-on-surface select-none">

      <div className="scanline-overlay" />
      <div className="grain-texture" />

      <div className="absolute top-24 left-12 w-32 h-32 border-l border-t border-surface-variant/30 pointer-events-none z-[110]" />
      <div className="absolute top-24 right-12 w-32 h-32 border-r border-t border-surface-variant/30 pointer-events-none z-[110]" />
      <div className="absolute bottom-32 left-12 w-32 h-32 border-l border-b border-surface-variant/30 pointer-events-none z-[110]" />
      <div className="absolute bottom-32 right-12 w-32 h-32 border-r border-b border-surface-variant/30 pointer-events-none z-[110]" />

      <aside className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-[110] pointer-events-none">
        <div className="font-label-sm text-label-sm vertical-rl rotate-180 flex gap-4 text-on-surface-variant">
          <span>COORD: 55.7558 N, 37.6173 E</span>
          <span>LEVEL: SUB-LEVEL 09</span>
          <span>O2: 18.4%</span>
        </div>
      </aside>

      <aside className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-[110] pointer-events-none">
        <div className="font-label-sm text-label-sm vertical-rl flex gap-4 text-on-surface-variant">
          <span>HEARTBEAT: 114 BPM</span>
          <span>STRESS: CRITICAL</span>
          <span>TRUTH_PROB: 34%</span>
        </div>
      </aside>

      <TopOverlay />
      <SessionTimer secondsRemaining={sessionSeconds} />
      <Silhouette emotion={emotion} />

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-primary-container/10 border border-primary-container px-4 py-2">
          <span className="font-label-bold text-label-bold text-primary-container">{error}</span>
        </div>
      )}

      <div className="flex flex-col flex-shrink-0">
        <ConversationLog messages={messages} />

        <footer className="relative z-[110] p-gutter flex justify-between items-end border-t-2 border-surface-variant bg-surface-container-low/90">

          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => setDossierOpen((o) => !o)}
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

          <InputBar phase={phase} onSubmit={handleSubmit} onMicStart={onMicStart} />

          <div className="w-16" />
        </footer>
      </div>

      <DevPanel onEmotionTest={testEmotion} />

      <DossierDrawer
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        evidence={collectedEvidence}
      />

      {showIntro && <IntroScreen onBegin={handleBegin} />}

      {phase === 'lose' && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-8">
          <div className="font-label-bold text-label-sm tracking-[0.5em] text-red-500 uppercase">
            ACCESS TERMINATED — FILE 1978/03/SECTOR-7
          </div>
          <div className="font-display text-display-lg text-red-400 text-center max-w-xl leading-tight">
            TIME EXPIRED
          </div>
          <div className="w-24 h-px bg-red-900" />
          <div className="font-body text-body-md text-on-surface-variant text-center max-w-sm leading-relaxed">
            Director Morozov has assumed control of the interrogation.<br />
            Your access to Sector 7 has been revoked.<br />
            Viktor Drago remains in custody. Case unresolved.
          </div>
          <div className="font-label-bold text-label-sm tracking-widest text-red-900 uppercase mt-8">
            ██████ OPERATION FAILED ██████
          </div>
          <button
            onClick={() => window.location.reload()}
            className="border border-red-900 px-10 py-3 font-label-bold text-label-bold tracking-[0.3em] uppercase text-red-700 hover:bg-red-950 transition-all duration-200 mt-4"
          >
            Try Again
          </button>
        </div>
      )}

      {phase === 'victory' && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-8">
          <div className="font-label-bold text-label-sm tracking-[0.5em] text-on-surface-variant uppercase">
            CASE CLOSED — FILE 1978/03/SECTOR-7
          </div>
          <div className="font-display text-display-lg text-on-surface text-center max-w-xl leading-tight">
            CONFESSION OBTAINED
          </div>
          <div className="w-24 h-px bg-surface-variant" />
          <div className="font-body text-body-md text-on-surface-variant text-center max-w-sm leading-relaxed">
            Excellent work, Interrogator.<br />
            Viktor Drago has been remanded to custody.<br />
            The Ministry thanks you for your service.
          </div>
          <div className="font-label-bold text-label-sm tracking-widest text-on-surface-variant/40 uppercase mt-8">
            ██████ CLASSIFIED ██████
          </div>
        </div>
      )}
    </div>
  )
}
