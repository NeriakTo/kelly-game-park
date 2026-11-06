import GamePage from './GamePage'
import TypingGame from '../games/typing/TypingGame'

export default function TypingPage() {
  return (
    <GamePage game="typing">
      <TypingGame />
    </GamePage>
  )
}
