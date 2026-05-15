import { useState, useEffect } from 'react'
import type { Emotion } from '../types'

const EMOTIONS: Emotion[] = ['CALM', 'NERVOUS', 'ANGRY', 'SILENT', 'CRACKING']

const FAKE_RESPONSES: Record<Emotion, { det: string; subj: string }> = {
  CALM:     { det: 'Viktor. Tell me your name and your role at the Ministry.', subj: 'I am Viktor Drago, senior archivist at the Ministry of Internal Affairs. I am happy to cooperate fully.' },
  NERVOUS:  { det: 'Where were you on the night of March 3rd? Near Sector 7?', subj: 'I was working late, doing routine archival work. I left the building by 10 PM, perhaps a little later, but I did not go near Sector 7.' },
  ANGRY:    { det: 'You are lying. Your badge was scanned at the Sector 7 corridor at 11:47 PM. Explain that.', subj: 'That is absolutely impossible. There must be an error in your records. I demand you check again. I was NOT in Sector 7.' },
  SILENT:   { det: 'We know about Brennan. What is your relationship with him?', subj: '...' },
  CRACKING: { det: 'On March 3rd you were in Sector 7. You handed the documents to Brennan. We have the proof. It is over.', subj: 'I... I was in Sector 7, I photographed documents, I gave them to Brennan, for money, I had no choice, I owed a debt, please...' },
}

interface Props {
  onEmotionTest: (emotion: Emotion, det: string, subj: string) => void
}

const isDev = new URLSearchParams(window.location.search).get('dev') === '1'

export default function DevPanel({ onEmotionTest }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' && e.ctrlKey) setVisible((v) => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!isDev || !visible) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 bg-black/90 border border-cctv-green p-3">
      <span className="font-label-bold text-cctv-green text-xs tracking-widest text-center">DEV — EMOTION TEST (Ctrl+`)</span>
      <div className="flex gap-2">
        {EMOTIONS.map((emotion) => (
          <button
            key={emotion}
            type="button"
            onClick={() => {
              const { det, subj } = FAKE_RESPONSES[emotion]
              onEmotionTest(emotion, det, subj)
            }}
            className="px-3 py-1 border border-cctv-green text-cctv-green font-label-bold text-xs tracking-widest hover:bg-cctv-green hover:text-black transition-colors"
          >
            {emotion}
          </button>
        ))}
      </div>
    </div>
  )
}
