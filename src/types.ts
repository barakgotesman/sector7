export type Emotion = 'CALM' | 'NERVOUS' | 'ANGRY' | 'SILENT' | 'CRACKING'

export type Phase = 'idle' | 'listening' | 'processing' | 'speaking' | 'victory'

export type MessageRole = 'interrogator' | 'suspect'

export interface Message {
  id: number
  role: MessageRole
  text: string
  thinking?: boolean
}

export type EvidenceKey = 'sector7' | 'march3' | 'brennan'

export type Evidence = Record<EvidenceKey, boolean>

export interface HistoryEntry {
  role: 'user' | 'model'
  parts: [{ text: string }]
}
