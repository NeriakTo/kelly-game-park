import DifficultySelector from '../components/UI/DifficultySelector'
import GoGame from '../games/go/GoGame'

export default function GoPage() {
  return (
    <div className="h-full space-y-3">
      <section className="lg:hidden bg-white/65 rounded-2xl p-4">
        <h2 className="text-2xl font-bold">⚫ 圍棋教室</h2>
        <p className="text-warm-text-light text-sm mt-1 mb-3">從零開始學圍棋，邊玩邊學</p>
        <DifficultySelector />
      </section>

      <section className="bg-white/40 rounded-2xl p-3 flex items-start justify-center overflow-auto">
        <GoGame />
      </section>
    </div>
  )
}
