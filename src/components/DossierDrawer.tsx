import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
  evidence: string[]
}

export default function DossierDrawer({ isOpen, onClose, evidence }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-0 top-0 h-full w-[85vw] max-w-2xl bg-surface-container-low border-r-2 border-surface-variant z-50 flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <div className="flex justify-between items-start p-6 border-b-2 border-surface-variant">
              <div>
                <span className="font-label-bold text-label-bold text-primary tracking-[0.2em]">
                  MINISTRY OF INTERNAL AFFAIRS
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-1">
                  CASE DOSSIER
                </h2>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  CASE #4471-B / SUBJECT: DRAGO, V.
                </span>
              </div>
              <div className="classified-stamp text-sm">CLASSIFIED</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="border border-surface-variant p-4">
                <span className="font-label-bold text-label-bold text-on-surface-variant tracking-widest uppercase block mb-3">
                  SUBJECT PROFILE
                </span>
                <p className="font-body-md text-body-md text-on-surface/80">
                  Viktor Drago — 43 years. Senior Archivist, Ministry of Internal Affairs.
                  No prior record. Security clearance: Level 4.
                </p>
              </div>

              <div className="border border-surface-variant p-4">
                <span className="font-label-bold text-label-bold text-on-surface-variant tracking-widest uppercase block mb-3">
                  EVIDENCE COLLECTED
                </span>
                {evidence.length === 0 ? (
                  <p className="font-body-md text-body-md text-on-surface/40 italic">
                    No evidence surfaced yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {evidence.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 border-b border-surface-variant/50 pb-2">
                        <span className="text-primary-container font-label-bold text-label-bold mt-0.5">▸</span>
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
