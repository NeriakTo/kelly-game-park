import DifficultySelector from '../components/UI/DifficultySelector'
import MemoryGame from '../games/memory/MemoryGame'

export default function MemoryPage() {
  return (
    <div className="h-full lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4">
      <section className="bg-white/65 rounded-2xl p-4 mb-4 lg:mb-0 lg:sticky lg:top-0 lg:self-start">
        <h2 className="text-2xl font-bold">🃏 記憶翻牌</h2>
        <p className="text-warm-text-light text-sm mt-1 mb-4">翻開兩張相同的卡片配對</p>
        <DifficultySelector />
      </section>

      <section className="bg-white/40 rounded-2xl p-3 flex items-start justify-center overflow-auto">
        <MemoryGame />
      </section>
    </div>
  )
}
