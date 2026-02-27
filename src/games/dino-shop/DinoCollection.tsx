import { motion, AnimatePresence } from 'framer-motion'
import type { DinoCollectionData } from './types'
import { DINO_COLLECTION, PIECES_PER_DINO } from './types'

interface DinoCollectionProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly data: DinoCollectionData
}

export default function DinoCollection({ isOpen, onClose, data }: DinoCollectionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-warm-bg rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-auto shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-warm-text">🏆 恐龍收藏</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-warm-text-light hover:bg-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-warm-text-light mb-4">
              每答對 3 題獲得 1 片化石碎片，集滿 {PIECES_PER_DINO} 片拼出完整恐龍！
            </p>

            <div className="grid grid-cols-2 gap-3">
              {DINO_COLLECTION.map((dino) => {
                const fossil = data.fossils.find((f) => f.dinoId === dino.id)
                const collected = fossil?.collectedPieces ?? 0
                const complete = collected >= PIECES_PER_DINO
                const progress = Math.min(collected / PIECES_PER_DINO, 1)

                return (
                  <motion.div
                    key={dino.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-xl border-2 text-center ${
                      complete
                        ? 'border-fossil bg-fossil-light/40'
                        : 'border-fossil-light/30 bg-white/60'
                    }`}
                  >
                    <div className={`text-3xl mb-1 ${complete ? '' : 'opacity-40 grayscale'}`}>
                      {dino.emoji}
                    </div>
                    <div className="text-sm font-medium text-warm-text">{dino.name}</div>
                    <div className="mt-2 h-2 rounded-full bg-fossil-light/40 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-fossil"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="text-xs text-warm-text-light mt-1">
                      {collected}/{PIECES_PER_DINO} 片
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-4 text-center text-sm text-warm-text-light">
              累計答對：{data.totalCorrect} 題
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
