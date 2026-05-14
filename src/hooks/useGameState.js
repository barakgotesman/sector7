import { useState, useCallback } from 'react'
import { EMOTIONS } from '../constants/emotions'
import { EVIDENCE_KEYS, EVIDENCE_LABELS } from '../constants/gameConfig'

/**
 * Build the starting evidence object from EVIDENCE_KEYS.
 * Every key begins as false — no evidence has been surfaced yet.
 * This lives outside the hook so it is only computed once at module load,
 * not re-created on every render.
 *
 * Example result: { sector7: false, march3: false, brennan: false }
 */
const initialEvidence = Object.fromEntries(EVIDENCE_KEYS.map((k) => [k, false]))

/**
 * useGameState — central state machine for the interrogation session.
 *
 * This hook owns every piece of game-critical state and exposes only the
 * minimal API that App.jsx needs. Keeping all state here (rather than
 * scattering useState calls across components) means there is a single
 * source of truth for the session: what phase we are in, how Viktor feels,
 * what evidence has been found, and the full conversation record.
 *
 * Returned values:
 *   phase          — current activity: 'idle' | 'listening' | 'processing' | 'speaking' | 'victory'
 *   setPhase       — advance or roll back the phase (used by App after API calls)
 *   emotion        — Viktor's current emotional state; drives Silhouette animation
 *   setEmotion     — updated after each Gemini response with the parsed emotion tag
 *   evidence       — { sector7: bool, march3: bool, brennan: bool } — which clues are found
 *   surfaceEvidence— marks one or more evidence keys as discovered
 *   messages       — ordered array of { id, role, text } shown in ConversationLog
 *   addMessage     — appends to both the display log and the Gemini history simultaneously
 *   history        — Gemini-formatted conversation history sent with every API call
 *   isUnlocked     — true only when ALL three evidence pieces have been surfaced;
 *                    gates the Accusation Panel's MAKE ACCUSATION button
 *   collectedEvidence — human-readable labels of the evidence found so far (for Dossier Drawer)
 */
export default function useGameState() {
  // phase controls which UI state is active and whether the mic button is enabled
  const [phase, setPhase] = useState('idle') // idle | listening | processing | speaking | accusation | victory

  // emotion drives the Silhouette component's Framer Motion variant
  const [emotion, setEmotion] = useState(EMOTIONS.CALM)

  // evidence tracks which of the three key clues have been mentioned in conversation
  const [evidence, setEvidence] = useState(initialEvidence)

  // messages is the display-facing log — only the last four are shown at a time (see ConversationLog)
  const [messages, setMessages] = useState([])

  // history is the Gemini API-facing log — sent in full with every request so Viktor
  // remembers everything that was said in the session (Gemini has no memory between calls)
  const [history, setHistory] = useState([])

  /**
   * addMessage — append a new line to both the visible conversation log and the Gemini history.
   *
   * Role mapping: 'interrogator' (player) maps to Gemini's 'user' role;
   * 'suspect' (Viktor) maps to Gemini's 'model' role. This is required by the
   * Gemini generateContent API — it only accepts 'user' and 'model' turn labels.
   *
   * The id defaults to Date.now() so that AnimatePresence in ConversationLog
   * can key on it for enter/exit transitions without requiring a separate counter.
   *
   * @param {'interrogator'|'suspect'} role  — who is speaking
   * @param {string} text                    — what was said
   * @param {number} [id=Date.now()]         — unique key for React reconciliation
   */
  const addMessage = useCallback((role, text, id = Date.now()) => {
    setMessages((prev) => [...prev, { id, role, text }])
    setHistory((prev) => [
      ...prev,
      { role: role === 'interrogator' ? 'user' : 'model', parts: [{ text }] },
    ])
  }, [])

  /**
   * updateLastMessage — replace the text of the most recently added message in-place.
   * Used by the typewriter effect to progressively reveal Viktor's response one
   * character at a time without adding new message entries.
   * History is NOT updated here — it was already set with the full text in addMessage.
   */
  const updateLastMessage = useCallback((text) => {
    setMessages((prev) => {
      if (!prev.length) return prev
      const updated = [...prev]
      updated[updated.length - 1] = { ...updated[updated.length - 1], text }
      return updated
    })
  }, [])

  /**
   * surfaceEvidence — mark one or more evidence keys as discovered.
   *
   * Called from App.jsx after each Gemini round-trip when keyword matching
   * finds evidence terms in the combined player+suspect text. Uses functional
   * update to avoid stale-closure issues — we never overwrite existing true values.
   *
   * @param {string[]} keys — subset of EVIDENCE_KEYS to mark true
   */
  const surfaceEvidence = useCallback((keys) => {
    setEvidence((prev) => {
      const next = { ...prev }
      // Only update keys that actually exist — ignore any unrecognised strings
      keys.forEach((k) => { if (k in next) next[k] = true })
      return next
    })
  }, [])

  /**
   * isUnlocked — the single gate that controls whether the player can accuse.
   * True only when every evidence key is true. Derived synchronously from state
   * so it is always in sync with the evidence object without needing an effect.
   */
  const isUnlocked = EVIDENCE_KEYS.every((k) => evidence[k])

  /**
   * collectedEvidence — the subset of evidence that has been found, as
   * human-readable strings for the Dossier Drawer's evidence list.
   */
  const collectedEvidence = EVIDENCE_KEYS
    .filter((k) => evidence[k])
    .map((k) => EVIDENCE_LABELS[k])

  return {
    phase, setPhase,
    emotion, setEmotion,
    evidence, surfaceEvidence,
    messages, addMessage, updateLastMessage,
    history,          // sent to /api/interrogate on every turn
    isUnlocked,       // gates the Accusation Panel
    collectedEvidence,
  }
}
