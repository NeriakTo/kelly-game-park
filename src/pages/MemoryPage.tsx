import DifficultySelector from '../components/UI/DifficultySelector'
import MemoryGame from '../games/memory/MemoryGame'

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">🃏 記憶翻牌</h2>
        <p className="text-warm-text-light text-sm mt-1">翻開兩張相同的卡片配對</p>
      </div>
      <DifficultySelector />
      <MemoryGame />
    </div>
  )
}
