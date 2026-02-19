import DifficultySelector from '../components/UI/DifficultySelector'
import SudokuGame from '../games/sudoku/SudokuGame'

export default function SudokuPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">🔢 數獨</h2>
        <p className="text-warm-text-light text-sm mt-1">填入 1-9，每行、每列、每宮不重複</p>
      </div>
      <DifficultySelector />
      <SudokuGame />
    </div>
  )
}
