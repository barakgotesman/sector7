import type { Emotion } from '../types'

export const EMOTIONS: Record<Emotion, Emotion> = {
  CALM: 'CALM',
  NERVOUS: 'NERVOUS',
  ANGRY: 'ANGRY',
  SILENT: 'SILENT',
  CRACKING: 'CRACKING',
}

export const EMOTION_REGEX = /\[(CALM|NERVOUS|ANGRY|SILENT|CRACKING)\]/g
