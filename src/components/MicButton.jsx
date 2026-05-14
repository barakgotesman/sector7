import React from 'react'
import { motion } from 'framer-motion'

/**
 * Visual configuration for each of the three mic button states.
 *
 * Rather than writing conditional class logic inline, we define a lookup table
 * so the component body stays declarative. Each entry controls:
 *   label       — the status text displayed below the button
 *   buttonClass — Tailwind classes for the button's background and border colour
 *   iconClass   — Tailwind class for the mic icon colour
 *   glow        — whether the red bloom behind the button should animate (pulse)
 *
 * The three states correspond exactly to the game phases visible to the player:
 *   idle       — waiting for the player to press; grey, no animation
 *   listening  — mic is open, red pulse active, recording in progress
 *   processing — API calls in-flight or Viktor is speaking; green tint, disabled
 */
const states = {
  idle: {
    label: 'AWAITING INPUT...',
    buttonClass: 'bg-secondary-container border-surface-variant', // dark grey — unobtrusive
    iconClass: 'text-on-surface',
    glow: false, // no bloom when waiting — silence is the default
  },
  listening: {
    label: 'CLICK TO STOP',
    buttonClass: 'bg-primary-container border-primary-container', // soviet red — active
    iconClass: 'text-on-primary-container',
    glow: true,  // pulsing red bloom radiates outward — player knows they are being heard
  },
  processing: {
    label: 'PROCESSING',
    buttonClass: 'bg-secondary-container border-cctv-green', // green border — system thinking
    iconClass: 'text-on-surface',
    glow: false, // no glow during processing — the system is working, not listening
  },
}

/**
 * MicButton — the hero interactive element of the interrogation interface.
 *
 * This is the single most important piece of UI in the game. Everything begins
 * here — the player's first tap starts the ambient audio, requests the microphone,
 * and launches the interrogation loop. It must feel weighty and deliberate.
 *
 * Three visual layers:
 *   1. Bloom div — an absolute-positioned blurred div behind the button that glows
 *      red when listening. Gives the impression of light emanating from the button.
 *   2. motion.button — the actual square button with Framer Motion whileTap scale.
 *      Square (not round) to match the institutional, non-consumer aesthetic.
 *   3. Status bar — a label and a thin progress-indicator line beneath the button.
 *      The line animates a sliding bar during listening and processing phases.
 *
 * The button is disabled (pointer-events blocked, opacity dimmed) during the
 * 'processing' state — the player cannot interrupt Viktor mid-sentence.
 *
 * Props:
 *   micState {'idle'|'listening'|'processing'} — current state; drives visual config
 *   onClick  {function}                        — called when the player presses the button
 */
export default function MicButton({ micState = 'idle', onClick }) {
  // Look up the config object for the current state; fall back to idle if unrecognised
  const s = states[micState] || states.idle

  return (
    <div className="flex flex-col items-center gap-4 mb-4">
      {/* Outer wrapper positions the bloom div relative to the button */}
      <div className="relative flex items-center justify-center">

        {/*
          Bloom div — the soft red halo behind the button.
          When listening: animate-pulse makes it throb in sync with the recording state.
          When idle: mic-glow-pulse is a subtler, always-present heartbeat — a hint that
          the button is alive and waiting even when the interrogation is paused.
          The blur-2xl and fixed 80×80 px size ensure it bleeds out past the button edges.
        */}
        <div
          className={`absolute inset-0 bg-primary-container rounded-full blur-2xl transition-opacity duration-300 ${
            s.glow ? 'opacity-30 animate-pulse' : 'opacity-10 mic-glow-pulse'
          }`}
          style={{ width: '80px', height: '80px' }}
        />

        {/*
          The button itself.
          whileTap scale-down gives tactile press feedback — the only moment of
          kinetic response in an otherwise still interface.
          shadow-[0_0_20px_rgba(0,0,0,0.8)] adds depth, lifting it off the footer surface.
          disabled:opacity-50 and disabled:cursor-not-allowed communicate clearly that
          the button is unavailable during processing without removing it from the DOM.
        */}
        <motion.button
          onClick={onClick}
          disabled={micState === 'processing'} // lock out during API calls and speaking — listening stays clickable so user can stop
          whileTap={{ scale: 0.93 }}
          className={`w-20 h-20 border-4 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 disabled:opacity-50 disabled:cursor-not-allowed ${s.buttonClass}`}
        >
          {/*
            Material Symbol mic icon.
            fontVariationSettings FILL=1 uses the filled variant of the icon,
            which reads more clearly at small sizes on a dark background.
          */}
          <span
            className={`material-symbols-outlined text-4xl ${s.iconClass}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            mic
          </span>
        </motion.button>
      </div>

      {/* Label and activity bar below the button */}
      <div className="flex flex-col items-center">
        {/*
          State label — terse, all-caps, tracking widened to read like a system terminal.
          animate-pulse keeps it pulsing in all states; in listening state the red colour
          and pulsing combine to signal that the system is alive and recording.
        */}
        <span className="font-label-bold text-label-bold text-primary tracking-tighter animate-pulse">
          {s.label}
        </span>

        {/*
          Activity bar — a thin horizontal line with a sliding segment inside.
          The sliding segment uses a custom 'slide' CSS animation (defined globally)
          that moves a 1/3-width colored block from left to right in a loop.
          Red (primary-container) for listening; green (cctv-green) for processing.
          Nothing slides when idle — the bar is present but static.
        */}
        <div className="h-[2px] w-32 bg-surface-variant mt-2 relative overflow-hidden">
          {micState === 'listening' && (
            <div
              className="absolute inset-0 bg-primary-container w-1/3"
              style={{ animation: 'slide 2s infinite linear' }} // slow slide — deliberate, measured
            />
          )}
          {micState === 'processing' && (
            <div
              className="absolute inset-0 bg-cctv-green w-1/3"
              style={{ animation: 'slide 1s infinite linear' }} // faster slide — urgency of processing
            />
          )}
        </div>
      </div>
    </div>
  )
}
