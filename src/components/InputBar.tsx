import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import SpeechRecognition from 'react-speech-recognition'
import useAppSpeechRecognition from '../hooks/useSpeechRecognition'
import type { Phase } from '../types'

const isChrome = SpeechRecognition.browserSupportsSpeechRecognition()

type MicState = 'idle' | 'listening' | 'processing'

const micStates: Record<MicState, { label: string; buttonClass: string; iconClass: string; glow: boolean }> = {
  idle: {
    label: 'CLICK TO SPEAK',
    buttonClass: 'bg-secondary-container border-surface-variant',
    iconClass: 'text-on-surface',
    glow: false,
  },
  listening: {
    label: 'CLICK TO STOP',
    buttonClass: 'bg-primary-container border-primary-container',
    iconClass: 'text-on-primary-container',
    glow: true,
  },
  processing: {
    label: 'PROCESSING',
    buttonClass: 'bg-secondary-container border-cctv-green',
    iconClass: 'text-on-surface',
    glow: false,
  },
}

function MicFace({ micState }: { micState: MicState }) {
  const s = micStates[micState] ?? micStates.idle
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute inset-0 bg-primary-container rounded-full blur-2xl transition-opacity duration-300 ${
            s.glow ? 'opacity-30 animate-pulse' : 'opacity-10 mic-glow-pulse'
          }`}
          style={{ width: '80px', height: '80px' }}
        />
        <motion.button
          type="button"
          disabled={micState === 'processing'}
          whileTap={{ scale: 0.93 }}
          className={`w-20 h-20 border-4 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 disabled:opacity-50 disabled:cursor-not-allowed ${s.buttonClass}`}
        >
          <span
            className={`material-symbols-outlined text-4xl ${s.iconClass}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            mic
          </span>
        </motion.button>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-label-bold text-label-bold text-primary tracking-tighter animate-pulse">
          {s.label}
        </span>
        <div className="h-[2px] w-32 bg-surface-variant mt-2 relative overflow-hidden">
          {micState === 'listening' && (
            <div className="absolute inset-0 bg-primary-container w-1/3" style={{ animation: 'slide 2s infinite linear' }} />
          )}
          {micState === 'processing' && (
            <div className="absolute inset-0 bg-cctv-green w-1/3" style={{ animation: 'slide 1s infinite linear' }} />
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  phase: Phase
  onSubmit: (text: string) => void
  onMicStart?: () => void
}

export default function InputBar({ phase, onSubmit, onMicStart }: Props) {
  const [mode, setMode] = useState<'chat' | 'speak'>('chat')
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = phase === 'processing' || phase === 'speaking'
  const transcriptRef = useRef('')
  // Stable ref so the isListening effect doesn't re-run on every onSubmit identity change
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => { onSubmitRef.current = onSubmit }, [onSubmit])

  const { isListening, transcript, start, stop } = useAppSpeechRecognition({
    onResult: onSubmit,
    onError: (e) => console.error('[SR]', e),
  })

  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  useEffect(() => {
    if (!isListening && transcriptRef.current.trim()) {
      onSubmitRef.current(transcriptRef.current.trim())
      transcriptRef.current = ''
    }
  }, [isListening])

  const micState: MicState = isListening ? 'listening' : isDisabled ? 'processing' : 'idle'

  const handleMicClick = () => {
    if (isListening) {
      stop(transcriptRef.current)
      transcriptRef.current = ''
      return
    }
    if (isDisabled) return
    onMicStart?.()
    start()
  }

  const handleChatSubmit = () => {
    const text = draft.trim()
    if (!text || isDisabled) return
    setDraft('')
    onSubmit(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  }

  useEffect(() => {
    if (mode === 'chat') textareaRef.current?.focus()
  }, [mode])

  return (
    <div className="flex flex-col items-center gap-3 mb-4 flex-1 min-w-0 px-2">
      {isChrome && (
        <div className="flex border border-surface-variant text-xs font-label-bold tracking-widest">
          {(['chat', 'speak'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1 uppercase transition-colors ${
                mode === m
                  ? 'bg-surface-variant text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {mode === 'chat' || !isChrome ? (
        <div className="flex items-end gap-2 w-full max-w-[480px]">
          <textarea
            ref={textareaRef}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder="Type your question..."
            className="flex-1 resize-none bg-surface-container border border-surface-variant text-on-surface font-label-sm text-label-sm px-3 py-2 placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <motion.button
            type="button"
            onClick={handleChatSubmit}
            disabled={isDisabled || !draft.trim()}
            whileTap={{ scale: 0.93 }}
            className="h-full px-4 py-3 border border-surface-variant bg-transparent hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-all font-label-bold tracking-widest uppercase text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            SEND
          </motion.button>
        </div>
      ) : (
        <div onClick={handleMicClick} className="cursor-pointer">
          <MicFace micState={micState} />
        </div>
      )}
    </div>
  )
}
