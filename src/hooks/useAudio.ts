import { useRef, useCallback, useEffect, useState } from 'react'

export default function useAudio() {
  const ambientRef = useRef<HTMLAudioElement | null>(null)
  const soundtrackRef = useRef<HTMLAudioElement | null>(null)
  const [isSoundtrackPlaying, setIsSoundtrackPlaying] = useState(false)

  useEffect(() => {
    ambientRef.current = new Audio('/sounds/ambient.mp3')
    ambientRef.current.loop = true
    ambientRef.current.volume = 0.4

    const soundtrack = new Audio('/sounds/Black Ice Protocol.mp3')
    soundtrack.loop = true
    soundtrack.volume = 0.5
    soundtrackRef.current = soundtrack

    return () => {
      ambientRef.current?.pause()
      soundtrack.pause()
    }
  }, [])

  const startAmbient = useCallback(() => {
    ambientRef.current?.play().catch(() => {})
  }, [])

  const stopAmbient = useCallback(() => {
    ambientRef.current?.pause()
  }, [])

  const startSoundtrack = useCallback(() => {
    soundtrackRef.current?.play().catch(() => {})
    setIsSoundtrackPlaying(true)
  }, [])

  const toggleSoundtrack = useCallback(() => {
    const s = soundtrackRef.current
    if (!s) return
    if (s.paused) {
      s.play().catch(() => {})
      setIsSoundtrackPlaying(true)
    } else {
      s.pause()
      setIsSoundtrackPlaying(false)
    }
  }, [])

  const setSoundtrackVolume = useCallback((v: number) => {
    if (soundtrackRef.current) soundtrackRef.current.volume = v
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
    startAmbient,
    stopAmbient,
    startSoundtrack,
    toggleSoundtrack,
    setSoundtrackVolume,
    isSoundtrackPlaying,
    playMicClick,
    playSuspectAudio,
  }
}
