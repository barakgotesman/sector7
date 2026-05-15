import { useState, useEffect, useCallback, useRef } from 'react'
import useGameState from './useGameState'
import useAudio from './useAudio'
import { EMOTION_REGEX } from '../constants/emotions'
import { EVIDENCE_LABELS } from '../constants/gameConfig'
import type { Emotion, EvidenceKey, HistoryEntry } from '../types'

// Total session length in seconds before the player loses
const TOTAL_SECONDS = 300

// Converts raw seconds into HH:MM:SS display string
function formatTime(seconds: number): string {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// Central orchestrator hook — wires game state, audio, and API calls together.
// All user input (voice or text) flows through handleSubmit.
export default function useInterrogation() {
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref-based guard so double-calls in the same tick are rejected reliably
  const processingRef = useRef(false)

  // Ref mirror of history so handleSubmit doesn't need history in its deps array
  const historyRef = useRef<HistoryEntry[]>([])

  const {
    phase, setPhase,
    emotion, setEmotion,
    evidence, surfaceEvidence,
    messages, addMessage, updateLastMessage,
    history,
  } = useGameState()

  // Human-readable list of evidence labels the player has surfaced so far
  const collectedEvidence = Object.entries(evidence)
    .filter(([, v]) => v)
    .map(([k]) => EVIDENCE_LABELS[k as EvidenceKey])

  const { playMicClick, playSuspectAudio } = useAudio()

  // Keep historyRef in sync with React state so handleSubmit always reads the latest history
  useEffect(() => { historyRef.current = history }, [history])

  // Count-up timer — triggers lose phase when TOTAL_SECONDS is reached
  useEffect(() => {
    if (!started) return
    const interval = setInterval(() => {
      setSessionSeconds((s) => {
        if (s + 1 >= TOTAL_SECONDS) { setPhase('lose'); clearInterval(interval); return TOTAL_SECONDS }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [started, setPhase])

  // Marks the session as active
  const startSession = useCallback(() => {
    setStarted(true)
  }, [])

  // Main input handler — accepts player text from either voice or chat mode.
  // Sends to /api/interrogate, parses emotion + evidence, then fetches TTS audio.
  // If TTS fails (e.g. quota exceeded), the response still typewriters out silently.
  const handleSubmit = useCallback(async (text: string) => {
    if (!text?.trim() || processingRef.current || !started) return

    processingRef.current = true

    setPhase('processing')
    const msgId = Date.now()
    addMessage('interrogator', text.trim(), msgId)
    // Placeholder suspect message — gets replaced character-by-character during typewriter
    addMessage('suspect', '', msgId + 1, true)

    try {
      const res = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: historyRef.current }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        if (res.status === 429) throw new Error('API quota exceeded. Try again in a moment.')
        if (res.status === 503) throw new Error('Server unavailable. Restart vercel dev.')
        throw new Error(err.error ?? `Interrogation failed (${res.status}).`)
      }

      const data = await res.json() as { text?: string }
      const raw = data.text ?? ''

      // Extract emotion tag (e.g. [NERVOUS]) from the start of the response
      const match = EMOTION_REGEX.exec(raw)
      const detectedEmotion: Emotion = (match ? match[1] : 'CALM') as Emotion
      EMOTION_REGEX.lastIndex = 0
      const responseText = raw.replace(EMOTION_REGEX, '').trim() || '...'
      EMOTION_REGEX.lastIndex = 0

      setEmotion(detectedEmotion)

      // Surface evidence if any of the three key terms appear in the exchange
      const keys: EvidenceKey[] = []
      if (/sector\s*7/i.test(text + responseText)) keys.push('sector7')
      if (/march\s*3|march 3rd/i.test(text + responseText)) keys.push('march3')
      if (/brennan/i.test(text + responseText)) keys.push('brennan')
      if (keys.length) surfaceEvidence(keys)

      // Fetch audio while thinking dots are still showing — wait until buffer is ready
      // so typewriter and playback start at the exact same moment
      const audioBuffer = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: responseText }),
      })
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .catch((err) => { console.warn('[SPEAK] TTS failed:', err); return null })

      // Switch to speaking phase — typewriter begins
      setPhase('speaking')

      let i = 0
      const typeInterval = setInterval(() => {
        i++
        updateLastMessage(responseText.slice(0, i))
        if (i >= responseText.length) clearInterval(typeInterval)
      }, 35)

      if (audioBuffer) {
        // Audio available — play it; typewriter runs in parallel and finishes with the audio
        await playSuspectAudio(audioBuffer)
      } else {
        // No audio (TTS quota/error) — wait for typewriter to finish before returning to idle
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (i >= responseText.length) { clearInterval(check); resolve() }
          }, 50)
        })
      }

      if (detectedEmotion === 'CRACKING') {
        setPhase('victory')
        processingRef.current = false
        return
      }

    } catch (err) {
      setError((err as Error).message || 'Connection error.')
    } finally {
      processingRef.current = false
      // Don't overwrite terminal phases (victory/lose) when returning to idle
      setPhase((prev) => (prev === 'victory' || prev === 'lose') ? prev : 'idle')
    }
  }, [started, addMessage, updateLastMessage, setPhase, setEmotion, surfaceEvidence, playSuspectAudio])

  // Plays the mic click sound when the player activates the microphone
  const onMicStart = useCallback(() => {
    playMicClick()
  }, [playMicClick])

  // Dev helper — injects a fake exchange to test a specific emotion state visually
  const testEmotion = useCallback((emotion: Emotion, det: string, subj: string) => {
    setEmotion(emotion)
    const msgId = Date.now()
    addMessage('interrogator', det, msgId)
    addMessage('suspect', subj, msgId + 1)
  }, [setEmotion, addMessage])

  return {
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
  }
}
