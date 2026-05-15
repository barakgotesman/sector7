import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

interface Props {
  onResult: (text: string) => void
  onError?: (msg: string) => void
}

export default function useAppSpeechRecognition({ onResult, onError }: Props) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({ commands: [] })

  const start = () => {
    resetTranscript()
    SpeechRecognition.startListening({ continuous: false, language: 'en-US' })
      .catch((err: Error) => onError?.(err.message || 'Mic error'))
  }

  const stop = (latestTranscript?: string) => {
    SpeechRecognition.stopListening()
    const text = (latestTranscript ?? transcript).trim()
    if (text) onResult(text)
  }

  return {
    isListening: listening,
    isSupported: browserSupportsSpeechRecognition,
    transcript,
    start,
    stop,
  }
}
