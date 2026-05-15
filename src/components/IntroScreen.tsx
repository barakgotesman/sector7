import { motion } from 'framer-motion'

interface IntroScreenProps {
  onBegin: () => void
}

export default function IntroScreen({ onBegin }: IntroScreenProps) {
  return (
    <motion.div
      className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <div className="scanline-overlay pointer-events-none" />
      <div className="grain-texture pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl px-6 py-10 flex flex-col gap-8">

        {/* Header stamp row */}
        <div className="flex items-start justify-between gap-4 border-b border-surface-variant pb-5">
          <div className="flex flex-col gap-1">
            <span className="font-label-bold text-label-bold text-on-surface-variant tracking-[0.25em] uppercase text-xs">
              Ministry of Internal Affairs
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant/40 tracking-widest text-xs">
              File 1978/03/SECTOR-7 — Eyes Only
            </span>
          </div>
          <div className="classified-stamp text-xs px-2 py-1 shrink-0">CLASSIFIED</div>
        </div>

        {/* Title block */}
        <div className="flex flex-col gap-2">
          <motion.h1
            className="font-display text-display-lg text-on-surface leading-none tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            SECTOR 7
          </motion.h1>
          <span className="font-label-bold text-label-bold text-primary tracking-[0.3em] uppercase text-xs">
            Interrogation — Case #4471-B
          </span>
        </div>

        {/* Briefing body */}
        <motion.div
          className="flex flex-col gap-4 border border-surface-variant p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-label-bold text-label-bold text-on-surface tracking-widest uppercase text-xs mb-1">Subject</span>
            <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
              Viktor Drago — 43. Senior Archivist, Ministry of Internal Affairs. Security clearance: Level 4. No prior record.
            </p>
          </div>

          <div className="h-px bg-surface-variant" />

          <div className="flex flex-col gap-1">
            <span className="font-label-bold text-label-bold text-on-surface tracking-widest uppercase text-xs mb-1">Charge</span>
            <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
              Theft and transfer of classified documents from Sector 7, night of March 3rd, 1978. Documents sold to a Western contact operating as{' '}
              <span className="text-on-surface font-label-bold text-label-bold tracking-wider">BRENNAN</span>.
            </p>
          </div>

          <div className="h-px bg-surface-variant" />

          <div className="flex flex-col gap-1">
            <span className="font-label-bold text-label-bold text-on-surface tracking-widest uppercase text-xs mb-1">Your Role</span>
            <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
              You observe via Camera 9-C. The subject believes he is speaking to a duty officer. He does not know who you are. Keep it that way.
            </p>
          </div>
        </motion.div>

        {/* Time warning */}
        <motion.div
          className="border border-red-900/70 bg-red-950/20 px-5 py-4 flex gap-3 items-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <span className="text-red-500 mt-0.5 shrink-0">▲</span>
          <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
            You have{' '}
            <span className="text-red-400 font-label-bold text-label-bold">5 minutes</span>{' '}
            before Director Morozov terminates your access. Extract a confession before the clock runs out.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="flex flex-col items-center gap-3 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <button
            onClick={onBegin}
            className="w-full border-2 border-on-surface py-4 font-label-bold text-label-bold tracking-[0.4em] uppercase text-on-surface hover:bg-on-surface hover:text-background transition-all duration-300"
          >
            Begin Interrogation
          </button>
          <span className="font-label-sm text-label-sm text-on-surface-variant/30 tracking-[0.3em] uppercase text-xs">
            Camera 9-C — Feed Active
          </span>
        </motion.div>

      </div>
    </motion.div>
  )
}
