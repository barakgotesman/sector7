import React from 'react'
import { motion } from 'framer-motion'

/**
 * The base CCTV filter chain applied to the suspect image at all times.
 * Prepended to every emotion variant so Framer Motion never strips it when
 * animating the drop-shadow — inline style and animate filter cannot coexist.
 */
const BASE = 'grayscale(100%) brightness(0.55) contrast(1.4) sepia(1) hue-rotate(80deg)'

/**
 * Per-emotion animate targets for the suspect image wrapper.
 *
 * Each variant drives three things simultaneously:
 *   x       — horizontal position (shake/lean)
 *   scale   — size (ANGRY leans in by scaling up slightly)
 *   opacity — presence (SILENT fades back, CRACKING flickers)
 *   filter  — CCTV base + drop-shadow glow intensity
 *
 * CRACKING and NERVOUS use array keyframes so Framer Motion treats them as
 * looping sequences rather than a single target value.
 */
const emotionVariants = {
  CALM: {
    x: 0,
    scale: 1,
    opacity: 0.9,
    filter: `${BASE} drop-shadow(0 0 12px rgba(26,58,26,0.8))`,
  },
  NERVOUS: {
    // Rapid horizontal jitter — Viktor fidgeting under pressure
    x: [-2, 2, -1, 1, 0],
    scale: 1,
    opacity: 0.9,
    filter: `${BASE} drop-shadow(0 0 16px rgba(26,58,26,0.9))`,
  },
  ANGRY: {
    // Leans slightly forward (scale up) — confrontational
    x: 0,
    scale: 1.03,
    opacity: 1,
    filter: `${BASE} drop-shadow(0 0 24px rgba(26,58,26,1))`,
  },
  SILENT: {
    // Withdraws — fades and shifts away
    x: -8,
    scale: 0.98,
    opacity: 0.45,
    filter: `${BASE} drop-shadow(0 0 6px rgba(26,58,26,0.3))`,
  },
  CRACKING: {
    // Violent shake + strobe — Viktor losing control
    x: [-4, 4, -3, 3, -2, 2, 0],
    scale: 1,
    opacity: [1, 0.6, 1, 0.5, 1, 0.7, 1],
    filter: `${BASE} drop-shadow(0 0 28px rgba(26,58,26,1))`,
  },
}

/**
 * Per-emotion transition overrides.
 *
 * NERVOUS and CRACKING repeat their keyframe sequences continuously so the
 * agitation is sustained for as long as the emotion is active.
 * All other states transition smoothly in 0.6 s.
 */
const emotionTransitions = {
  NERVOUS:  { duration: 0.4, repeat: Infinity, repeatType: 'mirror' },
  CRACKING: { duration: 0.25, repeat: Infinity, repeatType: 'mirror' },
}

/**
 * Silhouette — the full-screen suspect image rendered as a night-vision CCTV feed.
 *
 * Viktor's emotional state is communicated entirely through this component:
 * position, scale, opacity, and glow intensity all shift as the interrogation
 * progresses. The player reads his state from the image alone.
 *
 * Props:
 *   emotion {string} — one of CALM | NERVOUS | ANGRY | SILENT | CRACKING
 */
export default function Silhouette({ emotion = 'CALM' }) {
  const variant = emotionVariants[emotion] || emotionVariants.CALM
  const transition = emotionTransitions[emotion] || { duration: 0.6, ease: 'easeInOut' }

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/*
        motion.img drives all emotion animation — position, scale, opacity, and filter.
        The BASE filter chain is baked into every variant so it is never lost when
        Framer Motion overwrites the filter property during animation.
      */}
      <motion.img
        alt="Suspect"
        src="/suspect.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center"
        animate={variant}
        transition={transition}
      />

      {/* Grain overlay — sells the aged CCTV look */}
      <div className="absolute inset-0 bg-surface-container-lowest/50 mix-blend-overlay" />

      {/* Fluorescent light bar — rendered after the image so it sits on top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-4 bg-on-surface/20 blur-xl opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-on-surface opacity-80 shadow-[0_10px_60px_rgba(255,255,255,0.2)]" />
    </div>
  )
}
