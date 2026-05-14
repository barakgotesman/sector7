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
 */
export default function useSpeechRecognition({ onResult, onError }) {
  // Ref rather than state — we need to call .stop() on it imperatively without
  // causing a re-render cycle when we assign a new instance.
  const recognitionRef = useRef(null)

  // Exposed to consumers so they can reflect mic state in the UI (mic button colour, label).
  const [isListening, setIsListening] = useState(false)

  /**
   * start — create a fresh SpeechRecognition instance and begin listening.
   *
   * A new instance is created each time because the Web Speech API does not
   * support restarting a stopped recogniser — you must instantiate a new one.
   *
   * Configuration choices:
   *   lang = 'en-US'        — locked to English for v1; Hebrew support via he-IL planned
   *   interimResults = false — we only want the final transcript, not half-formed words
   *   maxAlternatives = 1   — we take the top hypothesis; alternatives add noise here
   */
  const start = useCallback(() => {
    // Support both the standard and the webkit-prefixed version (Chrome uses the latter)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      // This game is voice-only — there is no typed fallback, so this is a hard blocker
      onError('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'         // recognition language — matches interrogator persona
    recognition.interimResults = false  // wait for the full sentence before firing onResult
    recognition.maxAlternatives = 1     // only need the best guess

    /**
     * onresult fires when the browser has a final transcript.
     * e.results[0][0].transcript is the top alternative of the first (and only) result.
     * We immediately clear isListening before calling onResult so the UI transitions
     * to 'processing' state while the API call is in-flight.
     */
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setIsListening(false)
      onResult(transcript)
    }

    /**
     * onerror fires for mic permission denial, no-speech timeout, network errors, etc.
     * e.error is a short code string ('not-allowed', 'no-speech', 'network', ...).
     * We surface it to the caller who can format it into a user-facing message.
     */
    recognition.onerror = (e) => {
      setIsListening(false)
      onError(e.error)
    }

    /**
     * onend fires whenever the recogniser stops — whether due to silence, an error,
     * or an explicit .stop() call. We always sync isListening back to false here as
     * a safety net in case onerror was not fired first.
     */
    recognition.onend = () => {
      setIsListening(false)
    }

    // Store the instance so stop() can reach it
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [onResult, onError])

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
