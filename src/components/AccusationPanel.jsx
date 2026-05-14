import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AccusationPanel — the formal accusation drawer that slides in from the right.
 *
 * Opened by the crosshair (target) icon in the footer (bottom-right). This panel
 * is the end-game trigger — pressing MAKE ACCUSATION resolves the interrogation.
 *
 * The panel has two distinct visual modes controlled by `isUnlocked`:
 *
 *   LOCKED (isUnlocked = false):
 *     Shows the "INSUFFICIENT EVIDENCE" state with a ⊘ symbol and a checklist of
 *     the three required evidence pieces. The items are all shown as unchecked circles
 *     regardless of how many have actually been found — this is intentional, because
 *     the player is meant to discover evidence through conversation, not be given a
 *     progress checklist. The locked state exists purely to communicate that the
 *     accusation is not yet valid.
 *
 *   UNLOCKED (isUnlocked = true):
 *     All three evidence pieces have been surfaced. The panel turns red, the MAKE
 *     ACCUSATION button appears, and pressing it calls onAccuse to close the panel
 *     and transition the game to the 'victory' phase.
 *
 * Visual design:
 *   - Slides in from the right at 85 vw (capped at max-w-xl), mirroring the Dossier Drawer
 *   - Locked stamp uses muted brown (#5c403a) rather than red — communicates "blocked" not "danger"
 *   - The MAKE ACCUSATION button uses crt-bloom class for a bloom/glow effect when unlocked
 *   - Backdrop click closes the panel (same pattern as DossierDrawer)
 *
 * Props:
 *   isOpen     {boolean}  — whether the panel is currently visible
 *   onClose    {function} — called when the backdrop is clicked
 *   isUnlocked {boolean}  — true when all three evidence keys are surfaced; enables the button
 *   onAccuse   {function} — called when the player presses MAKE ACCUSATION
 *                           (App.jsx uses this to close the panel and set phase to 'victory')
 */
export default function AccusationPanel({ isOpen, onClose, isUnlocked, onAccuse }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/*
            Backdrop — same pattern as DossierDrawer.
            Clicking it dismisses the panel without making an accusation.
          */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/*
            Panel — slides in from the right.
            Slightly narrower than the Dossier Drawer (max-w-xl vs max-w-2xl)
            because the accusation UI is a single action, not a reading experience.
          */}
          <motion.div
            className="fixed right-0 top-0 h-full w-[85vw] max-w-xl bg-surface-container-low border-l-2 border-surface-variant z-50 flex flex-col"
            initial={{ x: '100%' }}   // starts off-screen to the right
            animate={{ x: 0 }}        // slides to natural position
            exit={{ x: '100%' }}      // exits back to the right
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* Panel header */}
            <div className="flex justify-between items-start p-6 border-b-2 border-surface-variant">
              <div>
                {/* Section label — small, tracked, institutional */}
                <span className="font-label-bold text-label-bold text-primary tracking-[0.2em]">
                  FORMAL ACCUSATION
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-1">
                  MAKE ACCUSATION
                </h2>
              </div>

              {/*
                LOCKED stamp — only shown when isUnlocked is false.
                Uses muted brown (#5c403a) rather than the soviet red used on CLASSIFIED stamps,
                because this is a functional status (blocked) rather than a classification level.
              */}
              {!isUnlocked && (
                <div className="classified-stamp text-sm" style={{ borderColor: '#5c403a', color: '#5c403a' }}>
                  LOCKED
                </div>
              )}
            </div>

            {/* Panel body — full height flex column, centred content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">

              {/* LOCKED state — show requirements and block the accusation */}
              {!isUnlocked ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  {/*
                    ⊘ symbol — universally communicates "forbidden / not allowed".
                    Brown colour matches the LOCKED stamp — the system is consistent
                    in using brown for "not ready" vs red for "active/danger".
                  */}
                  <div
                    className="text-6xl font-label-bold"
                    style={{ color: '#5c403a', fontFamily: 'Space Mono' }}
                  >
                    ⊘
                  </div>

                  <span className="font-label-bold text-label-bold text-on-surface-variant tracking-widest uppercase">
                    INSUFFICIENT EVIDENCE
                  </span>

                  <p className="font-body-md text-body-md text-on-surface/40">
                    Surface all three key evidence pieces before making an accusation.
                  </p>

                  {/*
                    Required evidence checklist — all items shown as grey circles regardless
                    of actual progress. This is intentional: the player discovers evidence
                    through conversation, not by checking off a list. The list tells them
                    what categories exist, not which they have found.
                  */}
                  <div className="border border-surface-variant p-4 w-full mt-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block mb-2 tracking-widest uppercase">
                      Required evidence
                    </span>
                    <ul className="flex flex-col gap-1">
                      {['Sector 7 connection', 'March 3rd, 1978', 'Brennan contact'].map((item) => (
                        <li
                          key={item}
                          className="font-body-md text-body-md text-on-surface/40 flex items-center gap-2"
                        >
                          {/* Grey circle — unchecked, always — deliberately not a progress tracker */}
                          <span className="text-on-surface-variant">○</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              ) : (
                /* UNLOCKED state — show the single accusation action */
                <div className="flex flex-col items-center gap-6 text-center w-full">
                  {/* Confirmation that all evidence is in hand — brief, no fanfare */}
                  <span className="font-label-bold text-label-bold text-primary-container tracking-widest uppercase">
                    ALL EVIDENCE OBTAINED
                  </span>

                  {/*
                    The MAKE ACCUSATION button — the most consequential press in the game.
                    whileTap gives slight scale-down tactile feedback.
                    crt-bloom class adds a red glow bloom to the button edges — the only
                    moment of "warmth" in the accusation flow, signalling finality.
                  */}
                  <motion.button
                    onClick={onAccuse}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 bg-primary-container text-on-primary font-label-bold text-label-bold tracking-widest uppercase text-xl border-4 border-primary-container hover:brightness-110 transition-all crt-bloom"
                  >
                    MAKE ACCUSATION
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
