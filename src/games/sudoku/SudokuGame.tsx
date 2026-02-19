import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Lightbulb, Check } from 'lucide-react'
import { generateSudoku, checkBoard } from './generator'
import { useGameStore } from '../../stores/gameStore'

type Board = (number | null)[][]

export default function SudokuGame() {
  const { currentDifficulty, addScore } = useGameStore()
  const [{ puzzle, solution }, setGame] = useState(() => generateSudoku(currentDifficulty))
  const [board, setBoard] = useState<Board>(() => puzzle.map((r) => [...r]))
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [won, setWon] = useState(false)
  const [startTime] = useState(Date.now())
  const [hints, setHints] = useState(0)

  const isOriginal = useCallback(
    (r: number, c: number) => puzzle[r][c] !== null,
    [puzzle],
  )

  const newGame = useCallback(() => {
    const g = generateSudoku(currentDifficulty)
    setGame(g)
    setBoard(g.puzzle.map((r) => [...r]))
    setSelected(null)
    setErrors(new Set())
    setWon(false)
    setHints(0)
  }, [currentDifficulty])

  useEffect(() => { newGame() }, [currentDifficulty, newGame])

  const placeNumber = useCallback(
    (num: number | null) => {
      if (!selected || isOriginal(selected[0], selected[1]) || won) return
      const [r, c] = selected
      const next = board.map((row) => [...row])
      next[r][c] = num
      setBoard(next)

      // Check error
      const key = `${r}-${c}`
      if (num !== null && num !== solution[r][c]) {
        setErrors((prev) => new Set(prev).add(key))
      } else {
        setErrors((prev) => {
          const s = new Set(prev)
          s.delete(key)
          return s
        })
      }

      // Check win
      if (num !== null && checkBoard(next)) {
        setWon(true)
        const duration = Math.floor((Date.now() - startTime) / 1000)
        addScore({
          gameType: 'sudoku',
          difficulty: currentDifficulty,
          score: Math.max(1000 - duration * 2 - hints * 50, 100),
          durationSeconds: duration,
        })
      }
    },
    [selected, board, solution, isOriginal, won, startTime, hints, currentDifficulty, addScore],
  )

  const giveHint = useCallback(() => {
    if (!selected || isOriginal(selected[0], selected[1]) || won) return
    const [r, c] = selected
    placeNumber(solution[r][c])
    setHints((h) => h + 1)
  }, [selected, isOriginal, won, solution, placeNumber])

  return (
    <div className="flex flex-col items-center gap-4">
      {won && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-mint rounded-2xl px-6 py-3 text-center shadow-lg"
        >
          <p className="text-2xl font-bold">🎉 太棒了！</p>
          <p className="text-sm text-warm-text-light">
            用時 {Math.floor((Date.now() - startTime) / 1000)} 秒
          </p>
        </motion.div>
      )}

      {/* Board */}
      <div className="grid grid-cols-9 gap-0 border-2 border-warm-text/30 rounded-lg overflow-hidden bg-white">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const sel = selected?.[0] === r && selected?.[1] === c
            const orig = isOriginal(r, c)
            const err = errors.has(`${r}-${c}`)
            const borderR = c % 3 === 2 && c < 8 ? 'border-r-2 border-r-warm-text/30' : 'border-r border-r-warm-text/10'
            const borderB = r % 3 === 2 && r < 8 ? 'border-b-2 border-b-warm-text/30' : 'border-b border-b-warm-text/10'

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-lg font-bold transition-colors
                  ${borderR} ${borderB}
                  ${sel ? 'bg-mint/50' : ''}
                  ${orig ? 'text-warm-text' : 'text-sky-600'}
                  ${err ? 'bg-pink/40 text-red-500' : ''}
                `}
              >
                {cell || ''}
              </button>
            )
          }),
        )}
      </div>

      {/* Number pad */}
      <div className="flex gap-2 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => placeNumber(n)}
            className="w-10 h-10 rounded-xl bg-white shadow-sm hover:bg-mint/30 font-bold text-lg transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => placeNumber(null)}
          className="w-10 h-10 rounded-xl bg-pink-light shadow-sm hover:bg-pink/30 font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button onClick={newGame} className="flex items-center gap-1 px-4 py-2 bg-cream rounded-full text-sm font-medium hover:bg-cream/80 transition-colors">
          <RotateCcw className="w-4 h-4" /> 新遊戲
        </button>
        <button onClick={giveHint} className="flex items-center gap-1 px-4 py-2 bg-sky-light rounded-full text-sm font-medium hover:bg-sky/50 transition-colors">
          <Lightbulb className="w-4 h-4" /> 提示 ({hints})
        </button>
        <button
          onClick={() => { if (checkBoard(board)) setWon(true) }}
          className="flex items-center gap-1 px-4 py-2 bg-mint rounded-full text-sm font-medium hover:bg-mint/80 transition-colors"
        >
          <Check className="w-4 h-4" /> 檢查
        </button>
      </div>
    </div>
  )
}
