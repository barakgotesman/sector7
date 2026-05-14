import React from 'react'

/**
 * TopOverlay — the institutional header bar at the top of the interrogation screen.
 *
 * Styled as a classified government document header — the kind that would appear
 * on a physical case file in the Ministry of Internal Affairs. It establishes the
 * diegetic frame: the player is not in a game menu, they are in a real case room.
 *
 * Layout is two columns justified to opposite edges:
 *   Left  — ministry name, case title, classification stamp, case number
 *   Right — live session timer with a pulsing red indicator dot, uplink status
 *
 * The session timer counts up from 00:00:00 to communicate how long the interrogation
 * has been running. This creates implicit pressure — how long has this taken? — without
 * ever explicitly pressuring the player with a countdown.
 *
 * The "UPLINK: ACTIVE" label implies the session is being observed and recorded,
 * reinforcing the surveillance aesthetic without any explanation.
 *
 * Props:
 *   sessionTime {string} — pre-formatted HH:MM:SS string from App.jsx's formatTime()
 */
export default function TopOverlay({ sessionTime }) {
  return (
    <header className="flex justify-between items-start p-gutter z-50 relative">

      {/* Left column — case identity block */}
      <div className="flex flex-col">
        {/* Ministry attribution — small, tracked wide, red — reads like a letterhead stamp */}
        <span className="font-label-bold text-label-bold text-primary tracking-[0.2em]">
          MINISTRY OF INTERNAL AFFAIRS
        </span>

        {/* Case title and classification stamp on the same row */}
        <div className="flex items-center gap-4 mt-2">
          {/* Large case title — the player's "location" within the dossier universe */}
          <span className="font-headline-md text-headline-md text-on-surface tracking-tighter">
            SECTOR 7
          </span>
          {/* CLASSIFIED stamp — uses the global .classified-stamp CSS class which adds
              the characteristic red border-box, angled text, and stamp-like spacing */}
          <div className="classified-stamp text-base px-2 py-0">CLASSIFIED</div>
        </div>

        {/* Case number — a mundane bureaucratic detail that sells the institutional feel */}
        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
          CASE #4471-B
        </span>
      </div>

      {/* Right column — live session status */}
      <div className="flex flex-col items-end">
        {/*
          Session timer block — a bordered container with a pulsing red dot.
          The dot (w-2 h-2 bg-primary-container animate-pulse) is a recording indicator —
          it signals that this session is live, not a playback.
        */}
        <div className="bg-surface-container px-3 py-1 border border-surface-variant flex items-center gap-2">
          <span className="w-2 h-2 bg-primary-container animate-pulse" /> {/* recording dot */}
          <span className="font-label-bold text-label-bold text-on-surface">
            SESSION {sessionTime}
          </span>
        </div>

        {/* Uplink status — static text that implies remote monitoring / observation */}
        <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
          UPLINK: ACTIVE
        </span>
      </div>
    </header>
  )
}
