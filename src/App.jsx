import React, { useState, useEffect, useCallback } from 'react'
import TopOverlay from './components/TopOverlay'
import Silhouette from './components/Silhouette'
import ConversationLog from './components/ConversationLog'
import MicButton from './components/MicButton'
import DossierDrawer from './components/DossierDrawer'
import AccusationPanel from './components/AccusationPanel'
import useGameState from './hooks/useGameState'
import useSpeechRecognition from './hooks/useSpeechRecognition'
import useAudio from './hooks/useAudio'
import { EMOTION_REGEX } from './constants/emotions'
import { EVIDENCE_LABELS } from './constants/gameConfig'

/**
 * formatTime — convert a raw second count into a HH:MM:SS display string.
 *
 * Used by the session timer in TopOverlay. The timer counts up from zero
 * to create silent pressure — the interrogation has been running for this long.
 * padStart(2, '0') ensures the format is always fixed-width (e.g. 00:04:07),
 * matching the clinical, monospace aesthetic of a government terminal clock.
 *
 * @param {number} seconds — total elapsed seconds
 * @returns {string} formatted as HH:MM:SS
 */
function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * App — root component and orchestrator of the entire interrogation game.
 *
 * This is a single-screen application. There are no routes, no pages, no navigation.
 * Everything lives in this one component tree. App's job is to:
 *   1. Own local UI state (drawer visibility, timer, error messages)
 *   2. Wire the three custom hooks together (game state, speech, audio)
 *   3. Implement the interrogation loop: speech → Gemini → ElevenLabs → play
 *   4. Render the full-screen layout with all overlaid UI elements
 *
 * The layout stacks three layers:
 *   - Background: scanline and grain CSS overlays (always on)
 *   - Middle: Silhouette (absolute, fills the entire screen)
 *   - Foreground: TopOverlay, ConversationLog, footer controls — float on top
 *
 * The decorative corner brackets and side metadata panels are purely atmospheric —
 * they reinforce the surveillance terminal aesthetic and are pointer-events-none.
 */
export default function App() {
  // Whether the Dossier Drawer is currently open (slides in from left)
  const [dossierOpen, setDossierOpen] = useState(false)

  // Whether the Accusation Panel is currently open (slides in from right)
  const [accusationOpen, setAccusationOpen] = useState(false)

  // Session timer counter — increments every second once `started` is true
  const [sessionSeconds, setSessionSeconds] = useState(0)

  // True after the player's first mic press; gates the session timer and ambient audio start.
  // We do not start either automatically on mount — browsers block audio without a user gesture,
  // and a running timer before anything happens would feel wrong.
  const [started, setStarted] = useState(false)

  // Holds the most recent error string to display as a banner.
  // Errors from Gemini, ElevenLabs, or the mic are surfaced here.
  const [error, setError] = useState(null)

  // Game state hook — owns phase, emotion, evidence, messages, and history
  const {
    phase, setPhase,
    emotion, setEmotion,
    evidence, surfaceEvidence,
    messages, addMessage,
    history,      // full Gemini-format conversation history sent with every API call
    isUnlocked,   // true when all three evidence keys are surfaced — unlocks the accusation
  } = useGameState()

  /**
   * collectedEvidence — the subset of evidence that has been found, formatted as
   * human-readable strings for the Dossier Drawer.
   *
   * Derived from the evidence object by filtering truthy keys and mapping to labels.
   * Re-computed on every render, but cheap since EVIDENCE_KEYS has only three items.
   */
  const collectedEvidence = Object.entries(evidence)
    .filter(([, v]) => v)
    .map(([k]) => EVIDENCE_LABELS[k])

  // Audio hook — manages ambient loop, mic click sound effect, and suspect voice playback
  const { startAmbient, playMicClick, playSuspectAudio } = useAudio()

  /**
   * Session timer effect — increments sessionSeconds by 1 every second.
   *
   * Only starts once `started` flips to true (the player's first mic press).
   * The cleanup function clears the interval on unmount, which also prevents
   * the timer from running after a hot-reload during development.
   */
  useEffect(() => {
    if (!started) return
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [started])

  /**
   * handleTranscript — the core interrogation loop, called with the player's speech text.
   *
   * This is the heart of the game. Every call to this function represents one full
   * interrogation exchange: the player has spoken, and now we must get Viktor's response
   * and play it. The steps are:
   *
   *   1. Set phase to 'processing' — disables the mic button, shows green activity bar
   *   2. Add the player's message to the conversation log
   *   3. POST to /api/interrogate with the message and full history
   *   4. Parse the emotion tag from Gemini's response (e.g. "[NERVOUS]")
   *   5. Update the silhouette emotion state
   *   6. Run keyword matching to automatically surface evidence
   *   7. Add Viktor's response to the conversation log
   *   8. Set phase to 'speaking' — still blocks the mic
   *   9. POST to /api/speak to synthesize Viktor's voice via ElevenLabs
   *  10. Await audio playback completion (playSuspectAudio returns a Promise)
   *  11. Set phase back to 'idle' — mic re-enables, player can speak again
   *
   * Error handling: any failure in steps 3–10 sets an error banner but still
   * returns to 'idle' via the `finally` block so the game is never stuck.
   *
   * Wrapped in useCallback because it is passed as a dependency to useSpeechRecognition.
   * Dependencies include all state setters and callbacks used inside.
   *
   * @param {string} text — the transcribed speech from Web Speech API
   */
  const handleTranscript = useCallback(async (text) => {
    // Disable the mic immediately — the player cannot interrupt while we process
    setPhase('processing')

    // Show the player's question in the conversation log right away (before API responds)
    addMessage('interrogator', text)

    try {
      // Step 3: Ask Gemini to respond as Viktor Drago
      const res = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      const raw = data.text || '' // Gemini's raw response, e.g. "[NERVOUS] I don't know Brennan."

      // Step 4: Extract the emotion tag from the start of Gemini's response.
      // EMOTION_REGEX matches [CALM], [NERVOUS], etc. at the beginning of the string.
      // If Gemini fails to include a tag (shouldn't happen given the system prompt),
      // we default to CALM so the silhouette does not freeze in an undefined state.
      const match = raw.match(EMOTION_REGEX)
      const detectedEmotion = match ? match[1] : 'CALM'
      const responseText = raw.replace(EMOTION_REGEX, '').trim() // strip tag, trim whitespace

      // Step 5: Update Viktor's emotional state — drives the Silhouette animation
      setEmotion(detectedEmotion)

      // Step 6: Keyword-based evidence surfacing.
      // We check BOTH the player's words and Viktor's response because Viktor may
      // voluntarily mention a key term (e.g. denying Sector 7) and that still counts
      // as the concept being "in the conversation". The regex patterns are intentionally
      // loose to handle natural variations in speech-to-text output.
      const keys = []
      if (/sector\s*7/i.test(text + responseText)) keys.push('sector7')
      if (/march\s*3|march 3rd/i.test(text + responseText)) keys.push('march3')
      if (/brennan/i.test(text + responseText)) keys.push('brennan')
      if (keys.length) surfaceEvidence(keys)

      // Step 7: Add Viktor's response to the visible conversation log
      addMessage('suspect', responseText)

      // Step 8: Switch to 'speaking' phase — mic stays locked while Viktor talks
      setPhase('speaking')

      // Step 9: Synthesize Viktor's voice via ElevenLabs
      const speakRes = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: responseText }),
      })
      const audioBuffer = await speakRes.arrayBuffer() // raw MP3 bytes

      // Step 10: Play the audio — awaiting this Promise means we do not return to 'idle'
      // until the last syllable of Viktor's sentence has played out
      await playSuspectAudio(audioBuffer)

    } catch (err) {
      // Surface API errors as a dismissable banner — do not crash the game
      setError('Connection error. Check API configuration.')
    } finally {
      // Step 11: Always return to idle, even if something went wrong,
      // so the player is never permanently locked out of the mic
      setPhase('idle')
    }
  }, [history, addMessage, setPhase, setEmotion, surfaceEvidence, playSuspectAudio])

  // Wire up the speech recognition hook with callbacks for success and error
  const { isListening, start: startListening } = useSpeechRecognition({
    onResult: handleTranscript, // called with transcript text when the player stops speaking
    onError: (e) => setError(`Mic error: ${e}`),
  })

  /**
   * handleMicClick — called when the player presses the mic button.
   *
   * Guards against pressing the button while processing or speaking (phase check).
   * On the very first press, starts the ambient audio — this must happen inside a
   * user gesture handler to satisfy browser autoplay policies.
   * Then plays the mic click sound effect, transitions to 'listening', and starts
   * speech recognition.
   */
  const handleMicClick = useCallback(() => {
    // Ignore presses during processing/speaking phases — the button is also visually
    // disabled in these states, but this guard defends against race conditions
    if (phase !== 'idle') return

    if (!started) {
      // First ever press — unlock audio and start the ambient loop
      setStarted(true)
      startAmbient()
    }

    playMicClick()          // tactile click feedback
    setPhase('listening')   // transition UI to the red recording state
    startListening()        // open the microphone
  }, [phase, started, startAmbient, playMicClick, setPhase, startListening])

  /**
   * micState — derived from isListening and phase for the MicButton component.
   *
   * MicButton only needs three states (idle/listening/processing) but the game has
   * more internal phases. This mapping collapses them:
   *   isListening = true            → 'listening' (red pulse)
   *   phase is 'processing'/'speaking' → 'processing' (green, disabled)
   *   anything else                 → 'idle' (grey, waiting)
   */
  const micState = isListening
    ? 'listening'
    : phase === 'processing' || phase === 'speaking'
      ? 'processing'
      : 'idle'

  return (
    /*
      Root container — fills the entire viewport, no overflow.
      bg-background is near-black (#0d0d0d).
      select-none prevents text selection on double-tap, keeping the experience clean.
    */
    <div className="relative h-screen w-screen overflow-hidden flex flex-col justify-between bg-background text-on-surface select-none">

      {/*
        Persistent atmospheric overlays — always on, never removed.
        scanline-overlay: horizontal scan lines across the full screen (CSS)
        grain-texture: film grain noise overlay (CSS)
        Together they give the UI the feel of an aged CRT monitor.
      */}
      <div className="scanline-overlay" />
      <div className="grain-texture" />

      {/*
        Decorative corner brackets — four absolute-positioned L-shaped borders,
        one in each corner of the main content area (below the header, above the footer).
        They evoke the target-lock brackets of surveillance camera software.
        pointer-events-none ensures they never block clicks.
      */}
      <div className="absolute top-24 left-12 w-32 h-32 border-l border-t border-surface-variant/30 pointer-events-none z-10" />
      <div className="absolute top-24 right-12 w-32 h-32 border-r border-t border-surface-variant/30 pointer-events-none z-10" />
      <div className="absolute bottom-32 left-12 w-32 h-32 border-l border-b border-surface-variant/30 pointer-events-none z-10" />
      <div className="absolute bottom-32 right-12 w-32 h-32 border-r border-b border-surface-variant/30 pointer-events-none z-10" />

      {/*
        Left metadata sidebar — coordinates, sub-level, oxygen levels.
        Rotated 90° and very faint by default (opacity-40), slightly brighter on hover.
        The values are fabricated atmospheric detail — they sell the idea that this is
        a real facility monitoring system without adding meaningful information.
        pointer-events-none: purely decorative, should never capture focus or clicks.
      */}
      <aside className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <div className="font-label-sm text-label-sm vertical-rl rotate-180 flex gap-4 text-on-surface-variant">
          <span>COORD: 55.7558 N, 37.6173 E</span> {/* Moscow coordinates */}
          <span>LEVEL: SUB-LEVEL 09</span>
          <span>O2: 18.4%</span> {/* slightly low — the room is oppressive */}
        </div>
      </aside>

      {/*
        Right metadata sidebar — biometric readings for the suspect.
        Again fabricated, but the values are chosen to feel alarming:
        elevated heart rate, critical stress, low truth probability.
        These are the kinds of readings an interrogator would actually want to see.
      */}
      <aside className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <div className="font-label-sm text-label-sm vertical-rl flex gap-4 text-on-surface-variant">
          <span>HEARTBEAT: 114 BPM</span>  {/* elevated — Viktor is nervous */}
          <span>STRESS: CRITICAL</span>
          <span>TRUTH_PROB: 34%</span>     {/* low — he is lying */}
        </div>
      </aside>

      {/* Case header — ministry name, SECTOR 7, classification stamp, session timer */}
      <TopOverlay sessionTime={formatTime(sessionSeconds)} />

      {/*
        The suspect silhouette — covers the entire screen behind all overlays.
        Receives the current emotion string so it can animate Viktor's state.
        It is absolute-positioned so it does not affect the flex layout of the page.
      */}
      <Silhouette emotion={emotion} />

      {/*
        Error banner — shown when an API call fails or the mic throws an error.
        Absolutely positioned below the header. The styling uses primary-container
        (soviet red variants) to flag it as an alert without being a pop-up.
      */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-primary-container/10 border border-primary-container px-4 py-2">
          <span className="font-label-bold text-label-bold text-primary-container">{error}</span>
        </div>
      )}

      {/*
        Bottom section — conversation log stacked on top of the footer controls.
        flex flex-col keeps the log directly above the footer with no gap.
      */}
      <div className="flex flex-col">
        {/* Subtitle-style conversation transcript — last 4 exchanges, oldest fading out */}
        <ConversationLog messages={messages} />

        {/*
          Footer — the control bar at the very bottom of the screen.
          border-t-2 gives a sharp institutional top edge.
          bg-surface-container-low/90 provides a translucent dark surface that lets
          the silhouette image show faintly through without compromising readability.
          Three sections: Dossier button (left), Mic (centre), Accuse (right).
        */}
        <footer className="relative z-50 p-gutter flex justify-between items-end border-t-2 border-surface-variant bg-surface-container-low/90">

          {/* Dossier button — left corner — opens the classified case file drawer */}
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

          {/* Mic button — centre — the most important element on the page */}
          <MicButton micState={micState} onClick={handleMicClick} />

          {/*
            Accuse button — right corner — opens the Accusation Panel.
            Visual state is tied to isUnlocked:
              Locked: greyed out, 40% opacity — present but clearly unavailable
              Unlocked: red border, red icon, hover brightens — the endgame is here
          */}
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

      {/*
        Dossier Drawer — slides in from the left when dossierOpen is true.
        Receives collectedEvidence (human-readable strings) rather than raw keys.
      */}
      <DossierDrawer
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        evidence={collectedEvidence}
      />

      {/*
        Accusation Panel — slides in from the right when accusationOpen is true.
        onAccuse closes the panel and advances the game to the 'victory' phase.
      */}
      <AccusationPanel
        isOpen={accusationOpen}
        onClose={() => setAccusationOpen(false)}
        isUnlocked={isUnlocked}
        onAccuse={() => { setAccusationOpen(false); setPhase('victory') }}
      />
    </div>
  )
}
