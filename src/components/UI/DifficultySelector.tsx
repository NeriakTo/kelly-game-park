import { useGameStore } from '../../stores/gameStore'
import { DIFFICULTY_LABELS, type Difficulty } from '../../types'

export default function DifficultySelector() {
  const { currentDifficulty, setDifficulty } = useGameStore()

  return (
    <div className="flex flex-wrap gap-2">
      {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
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
