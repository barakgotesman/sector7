import React from 'react'
import { motion } from 'framer-motion'

/**
 * Framer Motion animate targets for each of Viktor's emotional states.
 *
 * Each entry is passed directly to the `animate` prop of the motion.img element.
 * Opacity and the CSS drop-shadow filter are the two levers we pull:
 *   - opacity  → how "present" Viktor feels (SILENT fades back, CRACKING strobs)
 *   - filter   → intensity of the green CCTV glow around his silhouette
 *
 * CRACKING uses an array of opacity values rather than a single value — Framer
 * Motion interprets an array as a keyframe sequence, producing the strobe/flicker
 * effect without any custom animation code.
 *
 * The green color in the drop-shadow (rgba(26,58,26,...)) matches the CSS value
 * for --color-cctv-green in the design system, keeping the glow on-brand.
 */
const emotionVariants = {
  // Default — Viktor is in control. Subtle glow, full presence.
  CALM:     { opacity: 0.9, filter: 'drop-shadow(0 0 12px rgba(26,58,26,0.8))' },

  // Unease creeping in — fractionally brighter glow to suggest agitation
  NERVOUS:  { opacity: 0.9, filter: 'drop-shadow(0 0 14px rgba(26,58,26,0.9))' },

  // Viktor leans in — full opacity, maximum glow, confrontational presence
  ANGRY:    { opacity: 1,   filter: 'drop-shadow(0 0 20px rgba(26,58,26,1))' },

  // Viktor withdraws — opacity halved, glow almost gone, the silence is palpable
  SILENT:   { opacity: 0.5, filter: 'drop-shadow(0 0 6px rgba(26,58,26,0.4))' },

  // Viktor is losing control — opacity keyframes produce a visible strobe/flicker.
  // The array [1, 0.7, 1, 0.6, 1, 0.8, 1] makes Framer Motion cycle through
  // these values continuously, simulating a failing CCTV feed.
  CRACKING: { opacity: [1,0.7,1,0.6,1,0.8,1], filter: 'drop-shadow(0 0 24px rgba(26,58,26,1))' },
}

/**
 * Per-emotion transition overrides for Framer Motion.
 *
 * Most states transition smoothly over 0.6 s (the default below).
 * CRACKING is the exception — it loops rapidly (0.3 s per cycle, repeat: Infinity)
 * to sustain the flickering effect for as long as the emotion is active.
 *
 * Only CRACKING is listed here; all other emotions fall through to the default
 * transition defined in the component.
 */
const emotionTransitions = {
  CRACKING: { repeat: Infinity, duration: 0.3 },
}

/**
 * Silhouette — the full-screen image of Viktor Drago rendered as a night-vision CCTV feed.
 *
 * This is the most visually dominant element in the game. It occupies the entire
 * viewport behind all other UI overlays and communicates Viktor's emotional state
 * through Framer Motion animation — no text label, no indicator, just the image.
 *
 * The CSS filter chain on the img element converts the source photograph into the
 * green CCTV aesthetic:
 *   grayscale(100%)    — strip all colour first
 *   brightness(0.35)   — darken heavily — the room is barely lit
 *   contrast(1.5)      — sharpen the tonal range so shadows read as black
 *   sepia(0.2)         — introduce a faint warm tone before hue rotation
 *   hue-rotate(80deg)  — shift the sepia toward green, creating the night-vision tint
 *
 * The Framer Motion animate/transition props are applied on top of this base filter
 * by updating the drop-shadow and opacity.
 *
 * Props:
 *   emotion {string} — one of the EMOTIONS constant values (default: 'CALM').
 *                      Controls which emotionVariant and emotionTransition are active.
 */
export default function Silhouette({ emotion = 'CALM' }) {
  // Fall back to CALM if an unrecognised emotion string arrives — defensive coding
  const variant = emotionVariants[emotion] || emotionVariants.CALM

  // Use the emotion-specific transition if defined, otherwise a smooth 0.6 s ease
  const transition = emotionTransitions[emotion] || { duration: 0.6, ease: 'easeInOut' }

  return (
    // pointer-events-none — this layer is purely visual, must never block clicks on overlays
    <div className="absolute inset-0 pointer-events-none">

      {/*
        Fluorescent light bar above the suspect's head.
        Two layers: a wide soft bloom (blur-xl) plus a tight bright bar on top.
        The result reads as a single harsh institutional overhead light — the kind
        that hums and occasionally flickers in Soviet interrogation rooms.
      */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-4 bg-on-surface/20 blur-xl opacity-50 z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-on-surface opacity-80 shadow-[0_10px_60px_rgba(255,255,255,0.2)] z-10" />

      {/*
        The suspect image — the centrepiece of the entire UI.
        object-cover fills the full viewport without letterboxing.
        The inline style overrides the Tailwind grayscale class because we need
        the full CSS filter chain (brightness, contrast, sepia, hue-rotate) that
        cannot be composed from Tailwind utilities alone.
        Framer Motion's animate and transition drive the glow and opacity changes
        as Viktor's emotional state shifts.
      */}
      <motion.img
        alt="Suspect"
        src="/suspect.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center grayscale contrast-150"
        style={{ filter: 'grayscale(100%) brightness(0.35) contrast(1.5) sepia(0.2) hue-rotate(80deg)' }}
        animate={variant}
        transition={transition}
      />

      {/*
        Noise overlay — a translucent surface-container-lowest div blended with
        mix-blend-overlay. This adds a faint grain on top of the image that sells
        the aged, low-quality CCTV look and breaks up the flat gradients.
      */}
      <div className="absolute inset-0 bg-surface-container-lowest/50 mix-blend-overlay" />
    </div>
  )
}
