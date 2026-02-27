import { motion } from 'framer-motion'
import type { StageId } from './types'
import { STAGES } from './types'

interface StageSelectorProps {
  readonly currentStage: StageId
  readonly onSelect: (stage: StageId) => void
  readonly onOpenCollection: () => void
}

export default function StageSelector({
  currentStage,
  onSelect,
  onOpenCollection,
}: StageSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {STAGES.map((stage) => (
        <motion.button
          key={stage.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(stage.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            currentStage === stage.id
              ? 'bg-fossil text-white shadow-md'
              : 'bg-white/60 text-warm-text border border-fossil-light/40 hover:bg-fossil-light/30'
          }`}
        >
          <span>{stage.emoji}</span>
          <span>{stage.id} {stage.name}</span>
        </motion.button>
      ))}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onOpenCollection}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-cream text-warm-text border border-cream/60 hover:bg-cream/80 transition-all"
      >
        🏆 收藏
      </motion.button>
    </div>
  )
}
