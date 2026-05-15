import { useState, useEffect, useCallback } from 'react'
import useGameState from './useGameState'
import useAudio from './useAudio'
import { EMOTION_REGEX } from '../constants/emotions'
import { EVIDENCE_LABELS } from '../constants/gameConfig'
import type { Emotion, EvidenceKey } from '../types'

function formatTime(seconds: number): string {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function useInterrogation() {
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    .map(([k]) => EVIDENCE_LABELS[k as EvidenceKey])

  const { startAmbient, playMicClick, playSuspectAudio } = useAudio()

  useEffect(() => {
    if (!started) return
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [started])

  const handleSubmit = useCallback(async (text: string) => {
    if (!text?.trim() || phase !== 'idle') return

    if (!started) {
      setStarted(true)
      startAmbient()
    }

    setPhase('processing')
    addMessage('interrogator', text.trim())
    addMessage('suspect', '', Date.now(), true)

    try {
      const res = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        if (res.status === 429) throw new Error('API quota exceeded. Try again in a moment.')
        if (res.status === 503) throw new Error('Server unavailable. Restart vercel dev.')
        throw new Error(err.error ?? `Interrogation failed (${res.status}).`)
      }

      const data = await res.json() as { text?: string }
      const raw = data.text ?? ''

      const match = raw.match(EMOTION_REGEX)
      const detectedEmotion: Emotion = (match ? match[1] : 'CALM') as Emotion
      const responseText = raw.replace(EMOTION_REGEX, '').trim() || '...'

      setEmotion(detectedEmotion)

      const keys: EvidenceKey[] = []
      if (/sector\s*7/i.test(text + responseText)) keys.push('sector7')
      if (/march\s*3|march 3rd/i.test(text + responseText)) keys.push('march3')
      if (/brennan/i.test(text + responseText)) keys.push('brennan')
      if (keys.length) surfaceEvidence(keys)

      // Kick off TTS fetch without blocking — typewriter and audio start together
      const audioPromise = fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: responseText }),
      })
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .catch((err) => { console.warn('[SPEAK] TTS failed:', err); return null })

      setPhase('speaking')

      let i = 0
      const typeInterval = setInterval(() => {
        i++
        updateLastMessage(responseText.slice(0, i))
        if (i >= responseText.length) clearInterval(typeInterval)
      }, 35)

      const audioBuffer = await audioPromise
      if (audioBuffer) await playSuspectAudio(audioBuffer)

    } catch (err) {
      setError((err as Error).message || 'Connection error.')
    } finally {
      setPhase('idle')
    }
  }, [history, phase, started, startAmbient, addMessage, updateLastMessage, setPhase, setEmotion, surfaceEvidence, playSuspectAudio])

  const onMicStart = useCallback(() => {
    playMicClick()
  }, [playMicClick])

  return {
    emotion,
    messages,
    error,
    isUnlocked,
    collectedEvidence,
    sessionTime: formatTime(sessionSeconds),
    phase,
    setPhase,
    handleSubmit,
    onMicStart,
  }
}
