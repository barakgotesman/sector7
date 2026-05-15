import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface IntroScreenProps {
  onBegin: () => void
}

// Each entry is either a line of text or a blank spacer
type Line =
  | { type: 'label'; text: string }
  | { type: 'text'; text: string }
  | { type: 'gap' }
  | { type: 'divider' }
  | { type: 'warning'; text: string }

const LINES: Line[] = [
  { type: 'label', text: 'MINISTRY OF INTERNAL AFFAIRS' },
  { type: 'label', text: 'FILE 1978/03/SECTOR-7 — EYES ONLY' },
  { type: 'gap' },
  { type: 'divider' },
  { type: 'gap' },
  { type: 'label', text: 'SUBJECT' },
  { type: 'text',  text: 'Viktor Drago — 43. Senior Archivist, Ministry of Internal Affairs. Security clearance: Level 4. No prior record.' },
  { type: 'gap' },
  { type: 'label', text: 'CHARGE' },
  { type: 'text',  text: 'Theft and transfer of classified documents from Sector 7, night of March 3rd, 1978. Documents sold to a Western contact operating as BRENNAN.' },
  { type: 'gap' },
  { type: 'label', text: 'YOUR ROLE' },
  { type: 'text',  text: 'You observe via Camera 9-C. The subject believes he is speaking to a duty officer. He does not know who you are. Keep it that way.' },
  { type: 'gap' },
  { type: 'divider' },
  { type: 'gap' },
  { type: 'warning', text: '▲  You have 5 MINUTES before Director Morozov terminates your access. Extract a confession before the clock runs out.' },
  { type: 'gap' },
]

// How fast each character types, in ms — 30ms keeps it snappy but halves the render rate vs 18ms
const CHAR_DELAY = 30

export default function IntroScreen({ onBegin }: IntroScreenProps) {
  // Index of the line currently being typed
  const [lineIndex, setLineIndex] = useState(0)
  // How many characters of the current line are visible
  const [charIndex, setCharIndex] = useState(0)
  // Whether all lines have finished typing
  const [done, setDone] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Skip typewriter — jump straight to fully-revealed state
  const skipTyping = () => {
    if (done) return
    setLineIndex(LINES.length - 1)
    setCharIndex(LINES[LINES.length - 1].type === 'gap' || LINES[LINES.length - 1].type === 'divider' ? 0 : (LINES[LINES.length - 1] as { text: string }).text.length)
    setDone(true)
  }

  // Typewriter: advance one character at a time, then move to next line
  useEffect(() => {
    if (done) return

    const currentLine = LINES[lineIndex]

    // Gap and divider lines have no characters — advance immediately
    if (currentLine.type === 'gap' || currentLine.type === 'divider') {
      const t = setTimeout(() => {
        if (lineIndex + 1 >= LINES.length) { setDone(true); return }
        setLineIndex((i) => i + 1)
        setCharIndex(0)
      }, 80)
      return () => clearTimeout(t)
    }

    const fullText = currentLine.text
    if (charIndex < fullText.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), CHAR_DELAY)
      return () => clearTimeout(t)
    }

    // Line finished — pause briefly then move to next
    const t = setTimeout(() => {
      if (lineIndex + 1 >= LINES.length) { setDone(true); return }
      setLineIndex((i) => i + 1)
      setCharIndex(0)
    }, 120)
    return () => clearTimeout(t)
  }, [lineIndex, charIndex, done])

  // Auto-scroll to bottom whenever content grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lineIndex, charIndex])

  function renderLine(line: Line, idx: number, isActive: boolean) {
    const visible = idx < lineIndex || (idx === lineIndex && (line.type === 'gap' || line.type === 'divider'))
    const text = idx < lineIndex
      ? (line.type !== 'gap' && line.type !== 'divider' ? line.text : '')
      : isActive && line.type !== 'gap' && line.type !== 'divider'
      ? line.text.slice(0, charIndex)
      : ''

    if (line.type === 'gap') {
      return visible || isActive ? <div key={idx} className="h-3 sm:h-4" /> : null
    }

    if (line.type === 'divider') {
      return visible || isActive ? <div key={idx} className="h-px bg-surface-variant my-1" /> : null
    }

    if (!visible && !isActive) return null

    if (line.type === 'label') {
      return (
        <div key={idx} className="font-label-bold text-[10px] sm:text-xs tracking-[0.25em] uppercase text-on-surface-variant">
          {text}{isActive && <span className="animate-pulse">█</span>}
        </div>
      )
    }

    if (line.type === 'warning') {
      return (
        <div key={idx} className="text-sm sm:text-body-md text-on-surface-variant border border-red-900/60 bg-red-950/20 px-3 py-3 leading-relaxed">
          {text}{isActive && <span className="text-red-500 animate-pulse">█</span>}
        </div>
      )
    }

    return (
      <div key={idx} className="text-sm sm:text-body-md text-on-surface-variant leading-relaxed">
        {text}{isActive && <span className="animate-pulse opacity-60">█</span>}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-[200] bg-black flex flex-col overflow-hidden" onClick={skipTyping}>
      <div className="scanline-overlay pointer-events-none" />
      <div className="grain-texture pointer-events-none" />

      {/* Centered column — constrained on desktop, full-width on mobile */}
      <div className="flex-1 overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-xl flex flex-col h-full">

      {/* Tap to skip hint */}
      <AnimatePresence>
        {!done && (
          <motion.div
            className="absolute bottom-4 right-4 z-20 font-label-bold text-[10px] tracking-[0.25em] uppercase text-on-surface-variant/30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            tap to skip
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big title — always visible, never scrolls away */}
      <div className="shrink-0 px-4 sm:px-8 pt-6 sm:pt-10 pb-4 border-b border-surface-variant">
        <div className="font-display text-5xl sm:text-display-lg text-on-surface leading-none tracking-tight">
          SECTOR 7
        </div>
        <div className="font-label-bold text-[10px] sm:text-xs text-primary tracking-[0.3em] uppercase mt-2">
          Interrogation — Case #4471-B
        </div>
      </div>

      {/* Scrollable typing area — only this div scrolls */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 flex flex-col gap-2"
      >
        {LINES.map((line, idx) => renderLine(line, idx, idx === lineIndex))}

        {/* Begin button fades in after all lines typed */}
        <AnimatePresence>
          {done && (
            <motion.div
              className="flex flex-col items-center gap-3 pt-4 pb-6"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onBegin() }}
                className="w-full border-2 border-on-surface py-3 sm:py-4 font-label-bold text-sm sm:text-label-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase text-on-surface hover:bg-on-surface hover:text-background transition-all duration-300"
              >
                Begin Interrogation
              </button>
              <span className="font-label-sm text-[10px] sm:text-label-sm text-on-surface-variant/30 tracking-[0.3em] uppercase">
                Camera 9-C — Feed Active
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
      </div>
      </div>
    </div>
  )
}
