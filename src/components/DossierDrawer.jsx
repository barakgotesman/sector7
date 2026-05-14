import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * DossierDrawer — the classified case file panel that slides in from the left.
 *
 * Opened by the folder icon in the footer (bottom-left). Gives the player a
 * persistent record of what they have uncovered so far. Two sections:
 *   1. Subject Profile — static bio for Viktor Drago (always visible)
 *   2. Evidence Collected — dynamically populated as the player surfaces clues
 *
 * The drawer is always available to open, even before any evidence is found.
 * An empty evidence section shows "No evidence surfaced yet." — this communicates
 * that the list will fill rather than looking like a broken UI.
 *
 * Visual design:
 *   - Slides in at 85 vw (capped at max-w-2xl) — enough to feel immersive
 *     without fully hiding the suspect silhouette behind it
 *   - A black 50% backdrop covers the rest of the screen; clicking it closes the drawer
 *   - Header uses the same Ministry letterhead styling as TopOverlay for consistency
 *   - The CLASSIFIED stamp in the header reinforces the dossier-as-document metaphor
 *
 * Animation:
 *   - Drawer: x from '-100%' to 0 (slide in from left) — tween, 0.3 s
 *   - Backdrop: opacity 0 → 1 — fades in simultaneously
 *   - AnimatePresence handles the mount/unmount so exit animations play before removal
 *
 * Props:
 *   isOpen   {boolean}  — whether the drawer is currently visible
 *   onClose  {function} — called when the backdrop is clicked; should set isOpen to false
 *   evidence {string[]} — array of human-readable evidence label strings to display
 *                         (from collectedEvidence in App.jsx — already mapped from keys)
 */
export default function DossierDrawer({ isOpen, onClose, evidence }) {
  return (
    // AnimatePresence allows the exit animation to complete before the drawer is removed
    <AnimatePresence>
      {isOpen && (
        <>
          {/*
            Backdrop — semi-transparent black overlay covering the right portion of the screen.
            onClick triggers onClose so the player can dismiss the drawer without hunting for
            a close button. This matches standard drawer UX conventions.
          */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/*
            Drawer panel — slides in from the left edge.
            border-r-2 on the right edge gives it a hard institutional border
            that separates it visually from the game screen behind the backdrop.
            flex flex-col allows the header to stay fixed while the content scrolls.
          */}
          <motion.div
            className="fixed left-0 top-0 h-full w-[85vw] max-w-2xl bg-surface-container-low border-r-2 border-surface-variant z-50 flex flex-col"
            initial={{ x: '-100%' }}    // starts off-screen to the left
            animate={{ x: 0 }}          // slides to its natural position
            exit={{ x: '-100%' }}       // exits back to the left
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* Drawer header — styled as a classified government file folder header */}
            <div className="flex justify-between items-start p-6 border-b-2 border-surface-variant">
              <div>
                {/* Ministry attribution — mirrors TopOverlay for visual continuity */}
                <span className="font-label-bold text-label-bold text-primary tracking-[0.2em]">
                  MINISTRY OF INTERNAL AFFAIRS
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-1">
                  CASE DOSSIER
                </h2>
                {/* Case and subject reference — grounds the file in the game's fiction */}
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  CASE #4471-B / SUBJECT: DRAGO, V.
                </span>
              </div>
              {/* CLASSIFIED stamp in the header corner — every government file has one */}
              <div className="classified-stamp text-sm">CLASSIFIED</div>
            </div>

            {/* Scrollable content area — grows to fill available height */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

              {/* Section 1: Static subject profile — always shown, never changes */}
              <div className="border border-surface-variant p-4">
                <span className="font-label-bold text-label-bold text-on-surface-variant tracking-widest uppercase block mb-3">
                  SUBJECT PROFILE
                </span>
                <p className="font-body-md text-body-md text-on-surface/80">
                  Viktor Drago — 43 years. Senior Archivist, Ministry of Internal Affairs.
                  No prior record. Security clearance: Level 4.
                </p>
              </div>

              {/* Section 2: Dynamically populated evidence list */}
              <div className="border border-surface-variant p-4">
                <span className="font-label-bold text-label-bold text-on-surface-variant tracking-widest uppercase block mb-3">
                  EVIDENCE COLLECTED
                </span>

                {/* Empty state — shown until the first piece of evidence is surfaced */}
                {evidence.length === 0 ? (
                  <p className="font-body-md text-body-md text-on-surface/40 italic">
                    No evidence surfaced yet.
                  </p>
                ) : (
                  // Each evidence item gets a red bullet arrow to echo the accusation aesthetic
                  <ul className="flex flex-col gap-2">
                    {evidence.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 border-b border-surface-variant/50 pb-2"
                      >
                        {/* ▸ bullet in soviet red — connects visually to the accusation button */}
                        <span className="text-primary-container font-label-bold text-label-bold mt-0.5">
                          ▸
                        </span>
                        <span className="font-body-md text-body-md text-on-surface/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
