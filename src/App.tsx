import { useState } from 'react'
import useAudio from './hooks/useAudio'
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
  const [seenEvidenceCount, setSeenEvidenceCount] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [volumeOpen, setVolumeOpen] = useState(false)

  const { startSoundtrack, toggleSoundtrack, setSoundtrackVolume, isSoundtrackPlaying } = useAudio()

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value)
    setVolume(v)
    setSoundtrackVolume(v)
  }

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
    startSoundtrack()
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden flex flex-col justify-between bg-background text-on-surface select-none">

      <div className="scanline-overlay" />
      <div className="grain-texture" />

      <div className="hidden sm:block absolute top-24 left-12 w-32 h-32 border-l border-t border-surface-variant/30 pointer-events-none z-[103]" />
      <div className="hidden sm:block absolute top-24 right-12 w-32 h-32 border-r border-t border-surface-variant/30 pointer-events-none z-[103]" />
      <div className="hidden sm:block absolute bottom-32 left-12 w-32 h-32 border-l border-b border-surface-variant/30 pointer-events-none z-[103]" />
      <div className="hidden sm:block absolute bottom-32 right-12 w-32 h-32 border-r border-b border-surface-variant/30 pointer-events-none z-[103]" />

      <aside className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-[102] pointer-events-none">
        <div className="font-label-sm text-label-sm vertical-rl rotate-180 flex gap-4 text-on-surface-variant">
          <span>COORD: 55.7558 N, 37.6173 E</span>
          <span>LEVEL: SUB-LEVEL 09</span>
          <span>O2: 18.4%</span>
        </div>
      </aside>

      <aside className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-[102] pointer-events-none">
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

        <footer className="relative z-[110] px-2 sm:px-4 py-2 sm:py-3 flex items-end gap-1 sm:gap-2 border-t-2 border-surface-variant bg-surface-container-low/90" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>

          <div className="flex flex-col gap-2 items-center shrink-0">
            {(() => {
              const hasNew = collectedEvidence.length > seenEvidenceCount
              return (
                <div className="relative">
                  {hasNew && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full z-10 animate-pulse" />
                  )}
                  <button
                    onClick={() => { setDossierOpen((o) => !o); setSeenEvidenceCount(collectedEvidence.length) }}
                    className={`w-11 h-11 sm:w-16 sm:h-16 flex items-center justify-center border-2 transition-all group ${
                      hasNew
                        ? 'border-primary animate-pulse shadow-[0_0_12px_rgba(204,34,0,0.6)]'
                        : dossierOpen
                        ? 'border-surface-variant bg-surface-variant'
                        : 'border-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl sm:text-4xl ${hasNew ? 'text-primary' : dossierOpen ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                      folder
                    </span>
                  </button>
                </div>
              )
            })()}
            <span className="font-label-bold text-[10px] sm:text-label-sm text-on-surface-variant tracking-widest uppercase">
              DOSSIER
            </span>
          </div>

          <InputBar phase={phase} onSubmit={handleSubmit} onMicStart={onMicStart} />

          <div className="flex flex-col gap-2 items-center relative shrink-0">
            {volumeOpen && (
              <div className="absolute bottom-full mb-3 flex flex-col items-center gap-2 pb-1 bg-surface-container-low/90 border border-surface-variant px-3 py-3">
                <span className="font-label-bold text-label-sm text-on-surface-variant tracking-widest tabular-nums">
                  {Math.round(volume * 100)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="cursor-pointer"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '4px', height: '80px', accentColor: '#4ade80' }}
                />
                <button
                  onClick={toggleSoundtrack}
                  className="text-on-surface-variant hover:text-on-surface transition-colors mt-1 text-xs tracking-widest"
                >
                  {isSoundtrackPlaying ? '⏸' : '▶'}
                </button>
              </div>
            )}
            <button
              onClick={() => setVolumeOpen((o) => !o)}
              className="w-11 h-11 sm:w-16 sm:h-16 flex items-center justify-center border-2 border-surface-variant hover:bg-surface-variant transition-all group"
              aria-label="Toggle music / volume"
            >
              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-on-surface-variant group-hover:text-on-surface transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {isSoundtrackPlaying ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>
            <span className="font-label-bold text-[10px] sm:text-label-sm text-on-surface-variant tracking-widest uppercase">
              SOUND
            </span>
          </div>
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
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4 sm:gap-8 px-6">
          <div className="font-label-bold text-[10px] sm:text-label-sm tracking-[0.3em] sm:tracking-[0.5em] text-red-500 uppercase text-center">
            ACCESS TERMINATED — FILE 1978/03/SECTOR-7
          </div>
          <div className="font-display text-4xl sm:text-display-lg text-red-400 text-center leading-tight">
            TIME EXPIRED
          </div>
          <div className="w-24 h-px bg-red-900" />
          <div className="font-body text-sm sm:text-body-md text-on-surface-variant text-center max-w-sm leading-relaxed">
            Director Morozov has assumed control of the interrogation.<br />
            Your access to Sector 7 has been revoked.<br />
            Viktor Drago remains in custody. Case unresolved.
          </div>
          <div className="font-label-bold text-[10px] sm:text-label-sm tracking-widest text-red-900 uppercase mt-4 sm:mt-8 text-center">
            ██████ OPERATION FAILED ██████
          </div>
          <button
            onClick={() => window.location.reload()}
            className="border border-red-900 px-8 sm:px-10 py-3 font-label-bold text-sm sm:text-label-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-red-700 hover:bg-red-950 transition-all duration-200 mt-2 sm:mt-4"
          >
            Try Again
          </button>
        </div>
      )}

      {phase === 'victory' && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4 sm:gap-8 px-6">
          <div className="font-label-bold text-[10px] sm:text-label-sm tracking-[0.3em] sm:tracking-[0.5em] text-on-surface-variant uppercase text-center">
            CASE CLOSED — FILE 1978/03/SECTOR-7
          </div>
          <div className="font-display text-4xl sm:text-display-lg text-on-surface text-center leading-tight">
            CONFESSION OBTAINED
          </div>
          <div className="w-24 h-px bg-surface-variant" />
          <div className="font-body text-sm sm:text-body-md text-on-surface-variant text-center max-w-sm leading-relaxed">
            Excellent work, Interrogator.<br />
            Viktor Drago has been remanded to custody.<br />
            The Ministry thanks you for your service.
          </div>
          <div className="font-label-bold text-[10px] sm:text-label-sm tracking-widest text-on-surface-variant/40 uppercase mt-4 sm:mt-8 text-center">
            ██████ CLASSIFIED ██████
          </div>
        </div>
      )}
    </div>
  )
}
