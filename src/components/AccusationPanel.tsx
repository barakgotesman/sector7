import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
  isUnlocked: boolean
  onAccuse: () => void
}

export default function AccusationPanel({ isOpen, onClose, isUnlocked, onAccuse }: Props) {
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
            className="fixed right-0 top-0 h-full w-[85vw] max-w-xl bg-surface-container-low border-l-2 border-surface-variant z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <div className="flex justify-between items-start p-6 border-b-2 border-surface-variant">
              <div>
                <span className="font-label-bold text-label-bold text-primary tracking-[0.2em]">
                  FORMAL ACCUSATION
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-1">
                  MAKE ACCUSATION
                </h2>
              </div>
              {!isUnlocked && (
                <div className="classified-stamp text-sm" style={{ borderColor: '#5c403a', color: '#5c403a' }}>
                  LOCKED
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
              {!isUnlocked ? (
                <div className="flex flex-col items-center gap-4 text-center">
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
                    Continue the interrogation.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 text-center w-full">
                  <span className="font-label-bold text-label-bold text-primary-container tracking-widest uppercase">
                    ALL EVIDENCE OBTAINED
                  </span>
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
