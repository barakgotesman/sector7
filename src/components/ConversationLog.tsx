import { motion, AnimatePresence } from 'framer-motion'
import type { Message } from '../types'

interface Props {
  messages: Message[]
}

export default function ConversationLog({ messages }: Props) {
  const visible = messages.slice(-4)

  return (
    <div className="relative z-40 px-12 pb-32 flex flex-col items-center gap-3">
      <AnimatePresence initial={false}>
        {visible.map((msg, i) => {
          const age = visible.length - 1 - i
          const opacity = age === 0 ? 1 : age === 1 ? 0.7 : age === 2 ? 0.45 : 0.25
          const isInterrogator = msg.role === 'interrogator'

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className={`bg-surface-container-lowest/80 backdrop-blur-md px-6 py-3 max-w-2xl w-full border-l-4 ${
                isInterrogator ? 'border-primary-container' : 'border-cctv-green'
              }`}
            >
              <p className="font-body-lg text-body-lg text-on-surface/80">
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
