import { useState, useEffect, useCallback } from 'react'
import useGameState from './useGameState'
import useSpeechRecognition from './useSpeechRecognition'
import useAudio from './useAudio'
import { EMOTION_REGEX } from '../constants/emotions'
import { EVIDENCE_LABELS } from '../constants/gameConfig'

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function useInterrogation() {
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState(null)

  const {
    phase, setPhase,
    emotion, setEmotion,
    evidence, surfaceEvidence,
    messages, addMessage, updateLastMessage,
    history,
    isUnlocked,
  } = useGameState()

  const collectedEvidence = Object.entries(evidence)
    .filter(([, v]) => v)
    .map(([k]) => EVIDENCE_LABELS[k])

  const { startAmbient, playMicClick, playSuspectAudio } = useAudio()

  useEffect(() => {
    if (!started) return
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [started])

  // handleTranscript is the full interrogation round-trip: speech → Gemini → ElevenLabs → audio.
  // It is defined here (not in App) so all game state stays in one place.
  const handleTranscript = useCallback(async (text) => {
    setPhase('processing')
    addMessage('interrogator', text)

    try {
      const res = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 429) throw new Error('API quota exceeded. Try again in a moment.')
        if (res.status === 503) throw new Error('Server unavailable. Restart vercel dev.')
        throw new Error(err.error || `Interrogation failed (${res.status}).`)
      }

      const data = await res.json()
      const raw = data.text || ''

      const match = raw.match(EMOTION_REGEX)
      const detectedEmotion = match ? match[1] : 'CALM'
      const responseText = raw.replace(EMOTION_REGEX, '').trim() || '...'

      setEmotion(detectedEmotion)

      // Check both player text and Viktor's response — Viktor denying a keyword
      // still counts as the concept entering the conversation.
      const keys = []
      if (/sector\s*7/i.test(text + responseText)) keys.push('sector7')
      if (/march\s*3|march 3rd/i.test(text + responseText)) keys.push('march3')
      if (/brennan/i.test(text + responseText)) keys.push('brennan')
      if (keys.length) surfaceEvidence(keys)

      // Fetch audio before showing text — eliminates the gap between subtitle and voice
      const speakRes = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: responseText }),
      })

      // Show Viktor's text even if TTS fails — the interrogation continues without audio
      addMessage('suspect', '')
      setPhase('speaking')

      let i = 0
      const typeInterval = setInterval(() => {
        i++
        updateLastMessage(responseText.slice(0, i))
        if (i >= responseText.length) clearInterval(typeInterval)
      }, 35)

      if (speakRes.ok) {
        const audioBuffer = await speakRes.arrayBuffer()
        await playSuspectAudio(audioBuffer)
      } else {
        // TTS failed — text is already showing, just skip audio silently
        console.warn('[SPEAK] TTS failed:', speakRes.status)
      }

    } catch (err) {
      setError(err.message || 'Connection error.')
    } finally {
      // always return to idle — ensures the mic is never permanently locked on API failure
      setPhase('idle')
    }
  }, [history, addMessage, updateLastMessage, setPhase, setEmotion, surfaceEvidence, playSuspectAudio])

  const { isListening, start: startListening, stop: stopListening } = useSpeechRecognition({
    onResult: handleTranscript,
    onError: (e) => { setError(`Mic error: ${e}`); setPhase('idle') },
    // onEnd fires when recognition stops without a result — reset phase so mic re-enables
    onEnd: () => setPhase((p) => p === 'listening' ? 'idle' : p),
  })

  const handleMicClick = useCallback(() => {
    console.log('[MIC] clicked — current phase:', phase)

    // Second click while recording — stop and let onresult/onend send the transcript
    if (phase === 'listening') {
      stopListening()
      return
    }

    if (phase !== 'idle') return

    if (!started) {
      // startAmbient must be called inside a user gesture to satisfy browser autoplay policy
      setStarted(true)
      startAmbient()
    }

    playMicClick()
    setPhase('listening')
    startListening()
  }, [phase, started, startAmbient, playMicClick, setPhase, startListening, stopListening])

  const micState = isListening
    ? 'listening'
    : phase === 'processing' || phase === 'speaking'
      ? 'processing'
      : 'idle'

  return {
    emotion,
    micState,
    messages,
    error,
    isUnlocked,
    collectedEvidence,
    sessionTime: formatTime(sessionSeconds),
    phase,
    setPhase,
    handleMicClick,
  }
}
