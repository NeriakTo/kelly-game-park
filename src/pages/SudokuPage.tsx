import DifficultySelector from '../components/UI/DifficultySelector'
import SudokuGame from '../games/sudoku/SudokuGame'

export default function SudokuPage() {
  return (
    <div className="h-full space-y-3">
      <section className="lg:hidden bg-white/65 rounded-2xl p-4">
        <h2 className="text-2xl font-bold">🔢 數獨</h2>
        <p className="text-warm-text-light text-sm mt-1 mb-3">填入 1-9，每行、每列、每宮不重複</p>
        <DifficultySelector />
      </section>

      <section className="bg-white/40 rounded-2xl p-3 flex items-start justify-center overflow-auto">
        <SudokuGame />
      </section>
    </div>
  )
}
