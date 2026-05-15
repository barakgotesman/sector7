declare module 'react-speech-recognition' {
  interface SpeechRecognitionOptions {
    continuous?: boolean
    language?: string
    interimResults?: boolean
  }

  interface Command {
    command: string | string[] | RegExp
    callback: (...args: unknown[]) => void
    matchInterim?: boolean
    isFuzzyMatch?: boolean
    fuzzyMatchingThreshold?: number
    bestMatchOnly?: boolean
  }

  interface UseSpeechRecognitionOptions {
    commands?: Command[]
    transcribing?: boolean
    clearTranscriptOnListen?: boolean
  }

  interface UseSpeechRecognitionReturn {
    transcript: string
    interimTranscript: string
    finalTranscript: string
    listening: boolean
    resetTranscript: () => void
    browserSupportsSpeechRecognition: boolean
    isMicrophoneAvailable: boolean
  }

  export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn

  const SpeechRecognition: {
    startListening: (options?: SpeechRecognitionOptions) => Promise<void>
    stopListening: () => Promise<void>
    abortListening: () => Promise<void>
    browserSupportsSpeechRecognition: () => boolean
    browserSupportsContinuousListening: () => boolean
    getRecognition: () => SpeechRecognition | null
  }

  export default SpeechRecognition
}

declare module '*.css'
