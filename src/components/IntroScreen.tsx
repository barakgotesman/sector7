import { motion } from 'framer-motion'

interface IntroScreenProps {
  onBegin: () => void
}

export default function IntroScreen({ onBegin }: IntroScreenProps) {
  return (
    <motion.div
      className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      <div className="scanline-overlay" />
      <div className="grain-texture" />

      <div className="relative z-10 max-w-2xl w-full px-8 flex flex-col gap-6">

        <div className="flex items-center justify-between border-b border-surface-variant pb-4">
          <span className="font-label-bold text-label-bold text-primary tracking-[0.2em] uppercase">
            Ministry of Internal Affairs — Internal Use Only
          </span>
          <div className="classified-stamp text-sm px-2 py-0">CLASSIFIED</div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-label-bold text-label-bold text-on-surface-variant tracking-[0.3em] uppercase text-xs">
            Operation Sector 7 — Briefing Document
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant/50 tracking-widest">
            File 1978/03/SECTOR-7 — Eyes Only
          </span>
        </div>

        <div className="flex flex-col gap-4 font-body text-body-md text-on-surface-variant leading-relaxed border border-surface-variant p-6">
          <p>
            <span className="text-on-surface font-label-bold text-label-bold">SUBJECT:</span>{' '}
            Viktor Drago, 43. Senior Archivist, Ministry of Internal Affairs.
            No prior disciplinary record. Security clearance: Level 4.
          </p>
          <p>
            <span className="text-on-surface font-label-bold text-label-bold">CHARGE:</span>{' '}
            Theft and unauthorized transfer of classified documents from Sector 7 on the night of
            March 3rd, 1978. Documents believed sold to a Western contact operating under the alias
            <span className="text-on-surface"> BRENNAN</span>. National security compromised.
          </p>
          <p>
            <span className="text-on-surface font-label-bold text-label-bold">YOUR ROLE:</span>{' '}
            You are observing via Camera 9-C from your office. The subject does not know your
            identity. He believes he is speaking to a low-level duty officer. Do not correct this.
            He is considered a flight risk — do not let him stall.
          </p>
        </div>

        <div className="border border-red-900 bg-red-950/20 p-4">
          <p className="font-label-bold text-label-bold text-red-400 tracking-widest uppercase text-xs mb-2">
            ⚠ Time Warning
          </p>
          <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
            You have <span className="text-red-400 font-label-bold text-label-bold">5 minutes</span> before
            Director Morozov terminates your access and conducts this interrogation himself.
            Extract a confession before the clock runs out. He will ask no questions.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={onBegin}
            className="border-2 border-on-surface px-12 py-4 font-label-bold text-label-bold tracking-[0.4em] uppercase text-on-surface hover:bg-on-surface hover:text-background transition-all duration-200"
          >
            Begin Interrogation
          </button>
          <span className="font-label-sm text-label-sm text-on-surface-variant/40 tracking-widest uppercase text-xs">
            Camera 9-C — Feed Active
          </span>
        </div>

      </div>
    </motion.div>
  )
}
