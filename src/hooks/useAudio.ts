import { useCallback, useState } from 'react'

// Module-level singletons — shared across every useAudio() call so only one Audio object
// ever exists per sound, regardless of how many components call this hook.
let ambientAudio: HTMLAudioElement | null = null
let soundtrackAudio: HTMLAudioElement | null = null

function getSoundtrack(): HTMLAudioElement {
  if (!soundtrackAudio) {
    soundtrackAudio = new Audio('/sounds/Black Ice Protocol .mp3')
    soundtrackAudio.loop = true
    soundtrackAudio.volume = 0.5
  }
  return soundtrackAudio
}

export default function useAudio() {
  const [isSoundtrackPlaying, setIsSoundtrackPlaying] = useState(false)

  const startSoundtrack = useCallback(() => {
    getSoundtrack().play().catch(() => {})
    setIsSoundtrackPlaying(true)
  }, [])

  const toggleSoundtrack = useCallback(() => {
    const s = getSoundtrack()
    if (s.paused) {
      s.play().catch(() => {})
      setIsSoundtrackPlaying(true)
    } else {
      s.pause()
      setIsSoundtrackPlaying(false)
    }
  }, [])

  const setSoundtrackVolume = useCallback((v: number) => {
    getSoundtrack().volume = v
  }, [])

  const playMicClick = useCallback(() => {
    const click = new Audio('/sounds/mic-click.mp3')
    click.volume = 0.6
    click.play().catch(() => {})
  }, [])

  const playSuspectAudio = useCallback((audioBuffer: ArrayBuffer): Promise<void> => {
    return new Promise((resolve) => {
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
      audio.play().catch(resolve)
    })
  }, [])

  return {
    startSoundtrack,
    toggleSoundtrack,
    setSoundtrackVolume,
    isSoundtrackPlaying,
    playMicClick,
    playSuspectAudio,
  }
}
