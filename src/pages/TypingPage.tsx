import DifficultySelector from '../components/UI/DifficultySelector'
import TypingGame from '../games/typing/TypingGame'

export default function TypingPage() {
  return (
    <div className="h-full space-y-3">
      <section className="lg:hidden bg-white/65 rounded-2xl p-4">
        <h2 className="text-2xl font-bold">⌨️ 中/英打字練習</h2>
        <p className="text-warm-text-light text-sm mt-1 mb-3">先學鍵位與手指，再進入文章打字練習</p>
        <DifficultySelector />
      </section>

      <section className="bg-white/40 rounded-2xl p-3 flex items-start justify-center overflow-auto">
        <TypingGame />
      </section>
    </div>
  )
}
