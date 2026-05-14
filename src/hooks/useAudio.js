import { useRef, useCallback, useEffect } from 'react'

/**
 * useAudio — manages all audio in the game.
 *
 * There are three distinct audio sources:
 *   1. Ambient loop — a low industrial hum that runs from first mic press to session end.
 *      It sets the oppressive mood of the interrogation room and should never be silent.
 *   2. Mic click — a short mechanical sound that fires when the player presses the mic
 *      button. Provides tactile feedback; reinforces the "recording" metaphor.
 *   3. Suspect voice — the ElevenLabs-generated audio returned by /api/speak after each
 *      Gemini response. Played once per turn; the phase returns to 'idle' only after
 *      it finishes playing.
 *
 * The ambient Audio object is created in useEffect and persisted in a ref so we can
 * call .play() / .pause() imperatively without triggering re-renders. The effect's
 * cleanup pauses ambient if the component unmounts (e.g., during hot-reload in dev).
 *
 * Returned values:
 *   startAmbient    — begin the looping ambient track (called on first mic press)
 *   stopAmbient     — pause the ambient track (available but unused in v1)
 *   playMicClick    — fire the mic click one-shot sound
 *   playSuspectAudio— play ElevenLabs audio from an ArrayBuffer; returns a Promise
 *                     that resolves when playback finishes, so App can await it
 */
export default function useAudio() {
  // Persisted across renders without causing re-renders — we only call methods on it
  const ambientRef = useRef(null)

  /**
   * Create the ambient Audio object once on mount.
   * We do not auto-play here — browsers block audio that starts without a user gesture.
   * startAmbient() is called from handleMicClick (the first user interaction) instead.
   *
   * Volume is set to 0.4 — present enough to feel oppressive, low enough not to drown
   * out Viktor's voice or the mic click.
   */
  useEffect(() => {
    ambientRef.current = new Audio('/sounds/ambient.mp3')
    ambientRef.current.loop = true    // loop forever — silence would break the mood
    ambientRef.current.volume = 0.4   // low enough to sit under the suspect's voice

    // Pause on unmount to prevent audio from playing in the background after hot-reload
    return () => {
      ambientRef.current?.pause()
    }
  }, []) // empty deps — run once on mount only

  /**
   * startAmbient — begin playing the looping background hum.
   *
   * Called exactly once — the first time the player presses the mic button.
   * Subsequent mic presses skip this branch (the `started` flag in App.jsx gates it).
   * .catch(() => {}) silences the DOMException browsers throw if play() is blocked
   * by an autoplay policy — not expected after a user gesture, but safe to guard.
   */
  const startAmbient = useCallback(() => {
    ambientRef.current?.play().catch(() => {})
  }, [])

  /**
   * stopAmbient — pause the ambient track.
   *
   * Not used in the v1 game flow but exposed for future use (e.g., a victory screen
   * that cuts to silence for dramatic effect).
   */
  const stopAmbient = useCallback(() => {
    ambientRef.current?.pause()
  }, [])

  /**
   * playMicClick — fire the mic click sound effect.
   *
   * A new Audio instance is created each time rather than reusing a ref — this allows
   * rapid re-triggering without needing to reset currentTime. The volume is slightly
   * higher than ambient (0.6) so the click cuts through clearly as a UI signal.
   */
  const playMicClick = useCallback(() => {
    const click = new Audio('/sounds/mic-click.mp3')
    click.volume = 0.6
    click.play().catch(() => {}) // silently ignore if blocked (no-op; already guarded by user gesture)
  }, [])

  /**
   * playSuspectAudio — convert the raw audio ArrayBuffer from /api/speak into sound.
   *
   * The /api/speak serverless function returns raw MP3 bytes (not a URL), so we must:
   *   1. Wrap the bytes in a Blob with the correct MIME type
   *   2. Generate a temporary object URL pointing to that Blob
   *   3. Feed the URL to an Audio element and play it
   *   4. Revoke the URL once playback ends to free memory
   *
   * Returns a Promise so App.jsx can `await playSuspectAudio(buffer)` and only flip
   * the phase back to 'idle' after Viktor has finished speaking — the player cannot
   * interrupt mid-sentence.
   *
   * @param {ArrayBuffer} audioBuffer — raw MP3 bytes from the ElevenLabs API
   * @returns {Promise<void>} resolves when playback ends (or if play() is blocked)
   */
  const playSuspectAudio = useCallback((audioBuffer) => {
    return new Promise((resolve) => {
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob) // temporary in-memory URL for this audio chunk

      const audio = new Audio(url)

      audio.onended = () => {
        URL.revokeObjectURL(url) // clean up the object URL immediately after playback
        resolve()
      }

      // If play() is rejected (e.g., no user gesture — should not happen here), resolve
      // anyway so the game does not get stuck in 'speaking' phase indefinitely.
      audio.play().catch(resolve)
    })
  }, [])

  return {
    startAmbient,    // () => void  — start the ambient loop on first interaction
    stopAmbient,     // () => void  — pause the ambient loop
    playMicClick,    // () => void  — fire the mic click one-shot
    playSuspectAudio,// (ArrayBuffer) => Promise<void> — play Viktor's voice, await completion
  }
}
