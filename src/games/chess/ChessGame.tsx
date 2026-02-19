import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import {
  createInitialBoard, getValidMoves, getAIMove, getPieceName,
  isKingCaptured, applyMove,
  type ChessBoard, type Position,
} from './engine'
import { useGameStore } from '../../stores/gameStore'

export default function ChessGame() {
  const { currentDifficulty, addScore } = useGameStore()
  const [board, setBoard] = useState<ChessBoard>(createInitialBoard)
  const [selected, setSelected] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [turn, setTurn] = useState<'red' | 'black'>('red')
  const [gameOver, setGameOver] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [thinking, setThinking] = useState(false)

  const newGame = useCallback(() => {
    setBoard(createInitialBoard())
    setSelected(null)
    setValidMoves([])
    setTurn('red')
    setGameOver(null)
    setStartTime(Date.now())
  }, [])

  // AI move
  useEffect(() => {
    if (turn !== 'black' || gameOver) return
    setThinking(true)
    const timer = setTimeout(() => {
      const move = getAIMove(board, currentDifficulty)
      if (!move) {
        setGameOver('🎉 你贏了！')
        return
      }
      const next = applyMove(board, move.from, move.to)
      setBoard(next)
      setThinking(false)

      if (isKingCaptured(next, 'red')) {
        setGameOver('黑方獲勝 💀')
      } else {
        setTurn('red')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [turn, board, currentDifficulty, gameOver])

  const handleClick = useCallback((r: number, c: number) => {
    if (turn !== 'red' || gameOver || thinking) return

    const piece = board[r][c]

    if (selected) {
      // Try to move
      const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c)
      if (isValid) {
        const next = applyMove(board, selected, [r, c])
        setBoard(next)
        setSelected(null)
        setValidMoves([])

        if (isKingCaptured(next, 'black')) {
          setGameOver('🎉 你贏了！')
          const dur = Math.floor((Date.now() - startTime) / 1000)
          addScore({ gameType: 'chess', difficulty: currentDifficulty, score: Math.max(2000 - dur, 100), durationSeconds: dur })
        } else {
          setTurn('black')
        }
        return
      }
    }

    // Select own piece
    if (piece && piece.color === 'red') {
      setSelected([r, c])
      setValidMoves(getValidMoves(board, r, c))
    } else {
      setSelected(null)
      setValidMoves([])
    }
  }, [turn, board, selected, validMoves, gameOver, thinking, startTime, currentDifficulty, addScore])

  const isValidTarget = (r: number, c: number) => validMoves.some(([vr, vc]) => vr === r && vc === c)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${turn === 'red' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
          {thinking ? '🤔 AI 思考中...' : turn === 'red' ? '🔴 你的回合' : '⚫ AI 回合'}
        </span>
        <button onClick={newGame} className="flex items-center gap-1 px-3 py-1.5 bg-cream rounded-full text-sm hover:bg-cream/80">
          <RotateCcw className="w-4 h-4" /> 新局
        </button>
      </div>

      {gameOver && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-mint rounded-2xl px-6 py-3 text-center shadow-lg">
          <p className="text-2xl font-bold">{gameOver}</p>
        </motion.div>
      )}

      {/* Board */}
      <div className="relative bg-amber-100 rounded-lg p-2 shadow-inner" style={{ width: 'fit-content' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(9, 1fr)', gap: 0 }}>
          {board.map((row, r) =>
            row.map((piece, c) => {
              const sel = selected?.[0] === r && selected?.[1] === c
              const valid = isValidTarget(r, c)

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center relative border border-amber-300/50
                    ${sel ? 'bg-yellow-200/70' : ''}
                    ${valid ? 'bg-green-200/50' : ''}
                  `}
                >
                  {piece && (
                    <span className={`text-base sm:text-xl font-bold ${
                      piece.color === 'red' ? 'text-red-600' : 'text-gray-800'
                    } bg-amber-50 rounded-full w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center border-2 ${
                      piece.color === 'red' ? 'border-red-400' : 'border-gray-500'
                    } shadow-sm`}>
                      {getPieceName(piece)}
                    </span>
                  )}
                  {valid && !piece && (
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  )}
                </button>
              )
            }),
          )}
        </div>
        {/* River */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 text-center text-amber-600/40 font-bold text-sm pointer-events-none">
          楚 河 　 　 　 漢 界
        </div>
      </div>
    </div>
  )
}
