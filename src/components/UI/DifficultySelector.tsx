import { useGameStore } from '../../stores/gameStore'
import { AVAILABLE_DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../../types'

export default function DifficultySelector() {
  const currentDifficulty = useGameStore((s) => s.currentDifficulty)
  const setDifficulty = useGameStore((s) => s.setDifficulty)

  return (
    <div className="flex flex-wrap gap-2">
      {AVAILABLE_DIFFICULTIES.map((d) => (
        <button
          key={d}
          onClick={() => setDifficulty(d)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentDifficulty === d
              ? 'bg-mint text-warm-text shadow-sm'
              : 'bg-white/60 text-warm-text-light hover:bg-white'
          }`}
        >
          {'⭐'.repeat(d)} {DIFFICULTY_LABELS[d]}
        </button>
      ))}
    </div>
  )
}
