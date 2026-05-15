import { useState, useCallback } from 'react'
import { EMOTIONS } from '../constants/emotions'
import { EVIDENCE_KEYS, EVIDENCE_LABELS } from '../constants/gameConfig'
import type { Emotion, Phase, Message, MessageRole, Evidence, EvidenceKey, HistoryEntry } from '../types'

const initialEvidence = Object.fromEntries(
  EVIDENCE_KEYS.map((k) => [k, false])
) as Evidence

export default function useGameState() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [emotion, setEmotion] = useState<Emotion>(EMOTIONS.CALM)
  const [evidence, setEvidence] = useState<Evidence>(initialEvidence)
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const addMessage = useCallback((role: MessageRole, text: string, id = Date.now(), thinking = false) => {
    setMessages((prev) => [...prev, { id, role, text, thinking }])
    // Don't push thinking placeholders into the Groq history
    if (!thinking) {
      setHistory((prev) => [
        ...prev,
        { role: role === 'interrogator' ? 'user' : 'model', parts: [{ text }] },
      ])
    }
  }, [])

  const updateLastMessage = useCallback((text: string) => {
    setMessages((prev) => {
      if (!prev.length) return prev
      const updated = [...prev]
      updated[updated.length - 1] = { ...updated[updated.length - 1], text, thinking: false }
      return updated
    })
  }, [])

  const surfaceEvidence = useCallback((keys: EvidenceKey[]) => {
    setEvidence((prev) => {
      const next = { ...prev }
      keys.forEach((k) => { if (k in next) next[k] = true })
      return next
    })
  }, [])

  const isUnlocked = EVIDENCE_KEYS.every((k) => evidence[k])

  const collectedEvidence = EVIDENCE_KEYS
    .filter((k) => evidence[k])
    .map((k) => EVIDENCE_LABELS[k])

  return {
    phase, setPhase,
    emotion, setEmotion,
    evidence, surfaceEvidence,
    messages, addMessage, updateLastMessage,
    history,
    isUnlocked,
    collectedEvidence,
  }
}
