import DifficultySelector from '../components/UI/DifficultySelector'
import ChessGame from '../games/chess/ChessGame'

export default function ChessPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">♟️ 中國象棋</h2>
        <p className="text-warm-text-light text-sm mt-1">你執紅方，AI 執黑方</p>
      </div>
      <DifficultySelector />
      <ChessGame />
    </div>
  )
}
