import GamePage from './GamePage'
import GoGame from '../games/go/GoGame'

export default function GoPage() {
  return (
    <GamePage game="go">
      <GoGame />
    </GamePage>
  )
}
