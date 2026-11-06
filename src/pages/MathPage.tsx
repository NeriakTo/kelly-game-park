import GamePage from './GamePage'
import MathChallengeGame from '../games/math/MathChallengeGame'

export default function MathPage() {
  return (
    <GamePage game="math">
      <MathChallengeGame />
    </GamePage>
  )
}
