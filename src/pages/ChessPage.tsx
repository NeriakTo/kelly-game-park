import DifficultySelector from '../components/UI/DifficultySelector'
import ChessGame from '../games/chess/ChessGame'

export default function ChessPage() {
  return (
    <div className="h-full lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4">
      <section className="bg-white/65 rounded-2xl p-4 mb-4 lg:mb-0 lg:sticky lg:top-0 lg:self-start">
        <h2 className="text-2xl font-bold">♟️ 中國象棋</h2>
        <p className="text-warm-text-light text-sm mt-1 mb-4">你執紅方，AI 執黑方</p>
        <DifficultySelector />
      </section>

      <section className="bg-white/40 rounded-2xl p-2 sm:p-3 lg:p-2 xl:p-3 flex items-start justify-center overflow-auto">
        <ChessGame />
      </section>
    </div>
  )
}
