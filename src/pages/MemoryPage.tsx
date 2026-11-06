import GamePage from './GamePage'
import MemoryGame from '../games/memory/MemoryGame'

export default function MemoryPage() {
  return (
    <GamePage game="memory">
      <MemoryGame />
    </GamePage>
  )
}
