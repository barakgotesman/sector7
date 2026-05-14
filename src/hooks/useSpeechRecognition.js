import { useRef, useState, useCallback } from 'react'

/**
 * useSpeechRecognition — thin wrapper around the browser's Web Speech API.
 *
 * The Web Speech API is built into Chrome and Chromium-based browsers only.
 * It streams microphone audio to Google's servers and fires a result event
 * with the transcribed text. We do NOT use interim results — we wait for the
 * browser's final, confident transcript before passing it upstream.
 *
 * This hook owns the recognition instance (via a ref so it persists across
 * renders without causing re-renders itself) and exposes three things:
 *   isListening — true while the browser's mic is actively open
 *   start       — open the mic and begin recognition
 *   stop        — forcefully close the mic (used if we need to cancel mid-way)
 *
 * The hook does NOT manage what happens with the transcript — that is the
 * responsibility of the caller (App.jsx → handleTranscript). We just
 * surface the raw string via the onResult callback.
 *
 * @param {object}   params
 * @param {function} params.onResult — called with the final transcript string
 * @param {function} params.onError  — called with a short error string (browser error codes)
 * @param {function} params.onEnd    — called when recognition ends without producing a result
 */
export default function useSpeechRecognition({ onResult, onError, onEnd }) {
  // Ref rather than state — we need to call .stop() on it imperatively without
  // causing a re-render cycle when we assign a new instance.
  const recognitionRef = useRef(null)

  // Exposed to consumers so they can reflect mic state in the UI (mic button colour, label).
  const [isListening, setIsListening] = useState(false)

  /**
   * start — request mic permission explicitly, then begin recognition.
   *
   * We call getUserMedia before starting SpeechRecognition so that Chrome's
   * permission prompt is fully resolved before the recognition session opens.
   * Without this, the permission prompt causes the first recognition session to
   * end immediately (onend fires before onresult), requiring a double-click to work.
   *
   * The MediaStream is released immediately after — we only need getUserMedia
   * for the permission grant; SpeechRecognition manages its own audio capture.
   */
  const start = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('[SR] SpeechRecognition not supported in this browser')
      onError('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }

    console.log('[SR] creating recognition instance...')
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true   // don't auto-stop on silence — we stop manually after final result
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[SR] onstart — mic is open, listening...')
    }

    /**
     * onresult fires when the browser has a final transcript.
     * We use interimResults so we can log partial results for debugging,
     * but only call onResult when isFinal is true.
     */
    recognition.onresult = (e) => {
      const result = e.results[e.results.length - 1]
      const transcript = result[0].transcript
      console.log('[SR] onresult —', result.isFinal ? 'FINAL' : 'interim', transcript)
      if (result.isFinal) {
        recognition.stop() // manually stop — we got what we need
        setIsListening(false)
        onResult(transcript)
      }
    }

    /**
     * onerror fires for mic permission denial, no-speech timeout, network errors, etc.
     * e.error is a short code string ('not-allowed', 'no-speech', 'network', ...).
     * We surface it to the caller who can format it into a user-facing message.
     */
    recognition.onerror = (e) => {
      console.error('[SR] onerror —', e.error)
      setIsListening(false)
      onError(e.error)
    }

    /**
     * onend fires whenever the recogniser stops — whether due to silence, an error,
     * or an explicit .stop() call. We always sync isListening back to false here as
     * a safety net in case onerror was not fired first.
     */
    recognition.onend = () => {
      console.log('[SR] onend — recognition stopped')
      setIsListening(false)
      onEnd?.()
    }

    // Store the instance so stop() can reach it
    recognitionRef.current = recognition
    console.log('[SR] calling recognition.start()...')
    recognition.start()
    setIsListening(true)
  }, [onResult, onError, onEnd])

  /**
   * stop — abort the current recognition session.
   *
   * Optional chaining handles the case where start() was never called.
   * Calling .stop() fires the onend event, which will also set isListening to false,
   * so we set it here proactively to keep the UI responsive.
   */
  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return {
    isListening, // true while the mic is open and the browser is capturing audio
    start,       // () => void — begin a new recognition session
    stop,        // () => void — end the current session early
  }
}
