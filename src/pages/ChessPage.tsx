import GamePage from './GamePage'
import ChessGame from '../games/chess/ChessGame'

export default function ChessPage() {
  return (
    <GamePage game="chess">
      <ChessGame />
    </GamePage>
  )
}
