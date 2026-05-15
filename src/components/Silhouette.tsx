import { motion } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import type { Emotion } from '../types'

const BASE = 'grayscale(100%) brightness(0.55) contrast(1.4) sepia(1) hue-rotate(80deg)'

const emotionVariants: Record<Emotion, TargetAndTransition> = {
  CALM: {
    x: 0,
    scale: 1,
    opacity: 0.9,
    filter: `${BASE} drop-shadow(0 0 12px rgba(26,58,26,0.8))`,
  },
  NERVOUS: {
    x: [-2, 2, -1, 1, 0],
    scale: 1,
    opacity: 0.9,
    filter: `${BASE} drop-shadow(0 0 16px rgba(26,58,26,0.9))`,
  },
  ANGRY: {
    x: 0,
    scale: 1.03,
    opacity: 1,
    filter: `${BASE} drop-shadow(0 0 24px rgba(26,58,26,1))`,
  },
  SILENT: {
    x: -8,
    scale: 0.98,
    opacity: 0.45,
    filter: `${BASE} drop-shadow(0 0 6px rgba(26,58,26,0.3))`,
  },
  CRACKING: {
    x: [-4, 4, -3, 3, -2, 2, 0],
    scale: 1,
    opacity: [1, 0.6, 1, 0.5, 1, 0.7, 1],
    filter: `${BASE} drop-shadow(0 0 28px rgba(26,58,26,1))`,
  },
}

const emotionTransitions: Partial<Record<Emotion, Transition>> = {
  NERVOUS:  { duration: 0.4, repeat: Infinity, repeatType: 'mirror' },
  CRACKING: { duration: 0.25, repeat: Infinity, repeatType: 'mirror' },
}

const emotionImages: Record<Emotion, string> = {
  CALM:     '/calm.jpg',
  NERVOUS:  '/nervous.jpg',
  ANGRY:    '/angry.jpg',
  SILENT:   '/silent.jpg',
  CRACKING: '/cracking.jpg',
}

interface Props {
  emotion?: Emotion
}

export default function Silhouette({ emotion = 'CALM' }: Props) {
  const variant = emotionVariants[emotion] ?? emotionVariants.CALM
  const transition = emotionTransitions[emotion] ?? { duration: 0.6, ease: 'easeInOut' }
  const src = emotionImages[emotion] ?? emotionImages.CALM

  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.img
        alt="Suspect"
        src={src}
        className="absolute inset-0 w-full h-full object-cover object-center"
        animate={variant}
        transition={transition}
      />
      <div className="absolute inset-0 bg-surface-container-lowest/50 mix-blend-overlay" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-4 bg-on-surface/20 blur-xl opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-on-surface opacity-80 shadow-[0_10px_60px_rgba(255,255,255,0.2)]" />
    </div>
  )
}
