import DifficultySelector from '../components/UI/DifficultySelector'
import TypingGame from '../games/typing/TypingGame'

export default function TypingPage() {
  return (
    <div className="h-full lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4">
      <section className="bg-white/65 rounded-2xl p-4 mb-4 lg:mb-0 lg:sticky lg:top-0 lg:self-start">
        <h2 className="text-2xl font-bold">⌨️ 中/英打字練習</h2>
        <p className="text-warm-text-light text-sm mt-1 mb-4">練習準確率與速度，建立打字信心</p>
        <DifficultySelector />
      </section>

      <section className="bg-white/40 rounded-2xl p-3 flex items-start justify-center overflow-auto">
        <TypingGame />
      </section>
    </div>
  )
}
