import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ConversationLog — subtitle-style transcript of the interrogation.
 *
 * Styled deliberately like film subtitles rather than a chat interface.
 * The oldest lines fade and drift upward as new ones arrive; only the last
 * four exchanges are ever visible at once. This keeps the screen from filling
 * with text and forces the player to pay attention to the current moment.
 *
 * Visual language:
 *   - Each line has a 4 px left border: soviet red for the interrogator,
 *     CCTV green for the suspect. This lets the player parse speaker identity
 *     instantly, without reading the prefix label.
 *   - The prefix label (DET. ► / SUBJ. ▌) echoes subtitle conventions and
 *     also communicates the asymmetric power dynamic — the detective leads,
 *     the subject is held.
 *   - Opacity decreases with age: the most recent line is fully opaque (1.0),
 *     older lines ghost out (0.7 → 0.45 → 0.25), creating a natural fade.
 *   - backdrop-blur-md softens the background so the text is readable over
 *     the CCTV image without needing an opaque background box.
 *
 * AnimatePresence with initial={false} means lines that are already present
 * on mount do not run their enter animation — only genuinely new lines slide
 * up from below.
 *
 * Props:
 *   messages {Array<{id: number, role: string, text: string}>}
 *     — full conversation array from useGameState; this component slices it.
 *       role is either 'interrogator' or 'suspect'.
 */
export default function ConversationLog({ messages }) {
  // Only show the last 4 messages — older ones are silently dropped from view.
  // The player does not need a scrollable history; the interrogation lives in the present.
  const visible = messages.slice(-4)

  return (
    <div className="relative z-40 px-12 pb-32 flex flex-col items-center gap-3">
      {/*
        AnimatePresence tracks which messages are entering and leaving the visible slice.
        When a fifth message arrives, the oldest in `visible` gets an exit animation
        (opacity 0, y -10) before being removed from the DOM.
      */}
      <AnimatePresence initial={false}>
        {visible.map((msg, i) => {
          // age=0 is the newest message; age=3 is the oldest still visible
          const age = visible.length - 1 - i

          // Opacity decreases with age — the present moment is the clearest
          const opacity = age === 0 ? 1 : age === 1 ? 0.7 : age === 2 ? 0.45 : 0.25

          // Used to pick border colour, text colour, and prefix glyph
          const isInterrogator = msg.role === 'interrogator'

          return (
            <motion.div
              key={msg.id} // stable id (Date.now()) required for AnimatePresence to track exits
              initial={{ opacity: 0, y: 10 }}   // new lines rise from slightly below
              animate={{ opacity, y: 0 }}        // settle at target opacity based on age
              exit={{ opacity: 0, y: -10 }}      // old lines drift upward and vanish
              transition={{ duration: 0.4 }}
              className={`bg-surface-container-lowest/80 backdrop-blur-md px-6 py-3 max-w-2xl w-full border-l-4 ${
                // Red border for the interrogator (authority), green for the suspect (subject)
                isInterrogator ? 'border-primary-container' : 'border-cctv-green'
              }`}
            >
              <p className="font-body-lg text-body-lg text-on-surface/80">
                {/*
                  Speaker prefix — small, coloured, visually distinct from the speech text.
                  DET. ► implies forward movement, command, direction.
                  SUBJ. ▌ implies a pause, a held breath — the suspect choosing words carefully.
                */}
                <span
                  className={`font-label-bold mr-2 uppercase ${
                    isInterrogator ? 'text-primary-container' : 'text-cctv-green'
                  }`}
                >
                  {isInterrogator ? 'DET. ►' : 'SUBJ. ▌'}
                </span>
                {msg.text}
              </p>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
