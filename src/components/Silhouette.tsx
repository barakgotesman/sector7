import { motion } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import type { Emotion } from '../types'

const BASE = 'grayscale(100%) brightness(0.75) contrast(1.4) sepia(1) hue-rotate(80deg)'

// transform/opacity only — base filter is static on wrapper, glow is a separate overlay
const emotionVariants: Record<Emotion, TargetAndTransition> = {
  CALM:     { x: 0,                          scale: 1,    opacity: 0.9 },
  NERVOUS:  { x: [-2, 2, -1, 1, 0],          scale: 1,    opacity: 0.9 },
  ANGRY:    { x: 0,                          scale: 1.03, opacity: 1   },
  SILENT:   { x: -8,                         scale: 0.98, opacity: 0.45 },
  CRACKING: { x: [-4, 4, -3, 3, -2, 2, 0],  scale: 1,    opacity: [1, 0.6, 1, 0.5, 1, 0.7, 1] },
}

// Glow intensity per emotion — rendered as a separate div so the base image filter stays static
const emotionGlow: Record<Emotion, string> = {
  CALM:     'rgba(26,58,26,0.8)',
  NERVOUS:  'rgba(26,58,26,0.9)',
  ANGRY:    'rgba(26,80,26,1)',
  SILENT:   'rgba(26,58,26,0.3)',
  CRACKING: 'rgba(26,100,26,1)',
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

  const glow = emotionGlow[emotion] ?? emotionGlow.CALM

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Filter is static on the img — not in Framer Motion's animate prop, so no per-frame repaint */}
      <motion.img
        alt="Suspect"
        src={src}
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ filter: `${BASE} drop-shadow(0 0 40px ${glow})` }}
        animate={variant}
        transition={transition}
      />
      <div className="absolute inset-0 bg-surface-container-lowest/50 mix-blend-overlay" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-4 bg-on-surface/20 blur-xl opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-on-surface opacity-80 shadow-[0_10px_60px_rgba(255,255,255,0.2)]" />
    </div>
  )
}
