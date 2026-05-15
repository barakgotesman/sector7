import { useRef, useCallback, useEffect } from 'react'

export default function useAudio() {
  const ambientRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    ambientRef.current = new Audio('/sounds/ambient.mp3')
    ambientRef.current.loop = true
    ambientRef.current.volume = 0.4
    return () => { ambientRef.current?.pause() }
  }, [])

  const startAmbient = useCallback(() => {
    ambientRef.current?.play().catch(() => {})
  }, [])

  const stopAmbient = useCallback(() => {
    ambientRef.current?.pause()
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

  return { startAmbient, stopAmbient, playMicClick, playSuspectAudio }
}
