import GamePage from './GamePage'
import SudokuGame from '../games/sudoku/SudokuGame'

export default function SudokuPage() {
  return (
    <GamePage game="sudoku">
      <SudokuGame />
    </GamePage>
  )
}
