import { motion, AnimatePresence } from 'framer-motion'

interface HintBubbleProps {
  readonly message: string | null
  readonly autoDismiss?: number // ms
  readonly onDismiss?: () => void
}

export default function HintBubble({ message, autoDismiss, onDismiss }: HintBubbleProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onAnimationComplete={() => {
            if (autoDismiss && onDismiss) {
              setTimeout(onDismiss, autoDismiss)
            }
          }}
          className="bg-wood-light/90 border border-wood/40 rounded-xl px-4 py-2 text-sm text-warm-text shadow-sm"
        >
          💡 {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
