import { motion, AnimatePresence } from 'framer-motion'

type Mood = 'idle' | 'thinking' | 'happy' | 'hint'

const MOOD_FACES: Record<Mood, string> = {
  idle: '😊',
  thinking: '🤔',
  happy: '🎉',
  hint: '💡',
}

interface ShopkeeperProps {
  readonly message: string
  readonly mood?: Mood
}

export default function Shopkeeper({ message, mood = 'idle' }: ShopkeeperProps) {
  return (
    <div className="flex items-start gap-3 p-3">
      {/* 鴨嘴獸店長 */}
      <motion.div
        className="relative shrink-0"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-4xl">🦆</div>
        {/* CSS 偵探帽 */}
        <div
          className="absolute -top-2 -right-1 text-lg"
          style={{ transform: 'rotate(15deg)' }}
        >
          🎩
        </div>
      </motion.div>

      {/* 對話泡泡 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-2xl px-4 py-3 shadow-sm border border-fossil-light/50 flex-1"
        >
          {/* 泡泡三角形 */}
          <div className="absolute left-[-8px] top-4 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{MOOD_FACES[mood]}</span>
            <p className="text-sm text-warm-text leading-relaxed">{message}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
