import { Fragment, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import {
  createInitialBoard, getValidMoves, getAIMove, getPieceName,
  isCheckmate, isStalemate, isInCheck, applyMove,
  type ChessBoard, type Position,
} from './engine'
import { useGameStore } from '../../stores/gameStore'

type CutePieceSkin = {
  icon: string
  label: string
  bg: string
  border: string
}

const CUTE_PIECES: Record<string, CutePieceSkin> = {
  帥: { icon: '🦁', label: '帥', bg: 'from-red-100 to-rose-200', border: 'border-rose-300' },
  將: { icon: '🐯', label: '將', bg: 'from-slate-100 to-slate-200', border: 'border-slate-300' },
  仕: { icon: '🦊', label: '仕', bg: 'from-red-50 to-orange-100', border: 'border-orange-200' },
  士: { icon: '🐺', label: '士', bg: 'from-slate-50 to-zinc-100', border: 'border-zinc-200' },
  相: { icon: '🐘', label: '相', bg: 'from-red-50 to-pink-100', border: 'border-pink-200' },
  象: { icon: '🦏', label: '象', bg: 'from-slate-50 to-gray-100', border: 'border-gray-200' },
  傌: { icon: '🐴', label: '傌', bg: 'from-red-50 to-amber-100', border: 'border-amber-200' },
  馬: { icon: '🫎', label: '馬', bg: 'from-slate-50 to-stone-100', border: 'border-stone-200' },
  俥: { icon: '🦒', label: '俥', bg: 'from-red-50 to-yellow-100', border: 'border-yellow-200' },
  車: { icon: '🦛', label: '車', bg: 'from-slate-50 to-neutral-100', border: 'border-neutral-200' },
  炮: { icon: '🐲', label: '炮', bg: 'from-red-100 to-orange-200', border: 'border-orange-300' },
  砲: { icon: '🐉', label: '砲', bg: 'from-slate-100 to-blue-100', border: 'border-blue-200' },
  兵: { icon: '🐣', label: '兵', bg: 'from-red-50 to-lime-100', border: 'border-lime-200' },
  卒: { icon: '🐤', label: '卒', bg: 'from-slate-50 to-emerald-100', border: 'border-emerald-200' },
}

export default function ChessGame() {
  const currentDifficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)
  const aiMode = useGameStore((s) => s.aiModes.chess)
  const setAIMode = useGameStore((s) => s.setAIMode)
  const [board, setBoard] = useState<ChessBoard>(createInitialBoard)
  const [selected, setSelected] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [turn, setTurn] = useState<'red' | 'black'>('red')
  const [gameOver, setGameOver] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [thinking, setThinking] = useState(false)
  const [inCheck, setInCheck] = useState(false)
  const [showCutePiece, setShowCutePiece] = useState(false)
  const [lastAIMove, setLastAIMove] = useState<{ from: Position; to: Position } | null>(null)
  // 依視窗高度自適應棋盤，確保單頁可見
  const [cellSize, setCellSize] = useState(56)

  useEffect(() => {
    const recalc = () => {
      const vh = window.innerHeight
      // 預留上方控制列/邊距空間，剩餘高度分給 11 列（含楚河漢界）
      const available = vh - 190
      const next = Math.floor(available / 11)
      setCellSize(Math.max(42, Math.min(62, next)))
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])

  const newGame = useCallback(() => {
    setBoard(createInitialBoard())
    setSelected(null)
    setValidMoves([])
    setTurn('red')
    setGameOver(null)
    setStartTime(Date.now())
    setThinking(false)
    setInCheck(false)
    setLastAIMove(null)
  }, [])

  const checkGameEnd = useCallback((nextBoard: ChessBoard, nextTurn: 'red' | 'black') => {
    if (isCheckmate(nextBoard, nextTurn)) {
      const winner = nextTurn === 'black' ? '🎉 你贏了！' : '黑方獲勝 💀'
      setGameOver(winner)
      if (nextTurn === 'black') {
        const dur = Math.floor((Date.now() - startTime) / 1000)
        addScore({ gameType: 'chess', difficulty: currentDifficulty, score: Math.max(2000 - dur, 100), durationSeconds: dur })
      }
      return true
    }
    if (isStalemate(nextBoard, nextTurn)) {
      setGameOver('🤝 和棋（困斃）')
      return true
    }
    setInCheck(isInCheck(nextBoard, nextTurn))
    return false
  }, [startTime, currentDifficulty, addScore])

  useEffect(() => {
    if (aiMode !== 'ai' || turn !== 'black' || gameOver) return
    setThinking(true)
    const timer = setTimeout(() => {
      const move = getAIMove(board, currentDifficulty)
      setThinking(false)
      if (!move) {
        setGameOver('🎉 你贏了！')
        return
      }
      const next = applyMove(board, move.from, move.to)
      setBoard(next)
      setLastAIMove(move)

      if (!checkGameEnd(next, 'red')) {
        setTurn('red')
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [aiMode, turn, board, currentDifficulty, gameOver, checkGameEnd])

  const handleClick = useCallback((r: number, c: number) => {
    if (gameOver || thinking) return
    if (aiMode === 'ai' && turn !== 'red') return

    const piece = board[r][c]

    if (selected) {
      const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c)
      if (isValid) {
        const next = applyMove(board, selected, [r, c])
        setBoard(next)
        setSelected(null)
        setValidMoves([])
        setLastAIMove(null)

        const nextTurn = turn === 'red' ? 'black' : 'red'
        if (!checkGameEnd(next, nextTurn)) {
          setTurn(nextTurn)
        }
        return
      }
    }

    if (piece && piece.color === turn) {
      setSelected([r, c])
      setValidMoves(getValidMoves(board, r, c))
    } else {
      setSelected(null)
      setValidMoves([])
    }
  }, [turn, board, selected, validMoves, gameOver, thinking, checkGameEnd])

  const isValidTarget = (r: number, c: number) => validMoves.some(([vr, vc]) => vr === r && vc === c)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${turn === 'red' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
          {thinking ? '🤔 AI 思考中...' : turn === 'red' ? '🔴 你的回合' : '⚫ AI 回合'}
        </span>
        {inCheck && !gameOver && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-red-200 text-red-800 animate-pulse">
            ⚠️ 將軍！
          </span>
        )}
        <button
          onClick={() => setShowCutePiece((v) => !v)}
          className="px-3 py-1.5 bg-pink-light rounded-full text-sm hover:bg-pink/60"
        >
          {showCutePiece ? '切換：經典棋子' : '切換：可愛插畫棋子'}
        </button>
        <button onClick={newGame} className="flex items-center gap-1 px-3 py-1.5 bg-cream rounded-full text-sm hover:bg-cream/80">
          <RotateCcw className="w-4 h-4" /> 新局
        </button>
      </div>

      {gameOver && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-mint rounded-2xl px-6 py-3 text-center shadow-lg">
          <p className="text-2xl font-bold">{gameOver}</p>
        </motion.div>
      )}

      <div className="relative bg-amber-100 rounded-lg p-2 shadow-inner" style={{ width: 'fit-content' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(9, 1fr)', gap: 0 }}>
          {Array.from({ length: 10 }, (_, r) => {
            const rowCells = board[r].map((piece, c) => {
              const sel = selected?.[0] === r && selected?.[1] === c
              const valid = isValidTarget(r, c)
              const isAIFrom = lastAIMove?.from[0] === r && lastAIMove?.from[1] === c
              const isAITo = lastAIMove?.to[0] === r && lastAIMove?.to[1] === c
              const label = piece ? getPieceName(piece) : ''

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  aria-label={piece ? `${r + 1}行${c + 1}列 ${label}` : `${r + 1}行${c + 1}列 空格`}
                  className={`flex items-center justify-center relative border border-amber-400/50
                    ${sel ? 'bg-yellow-200/80' : ''}
                    ${valid ? 'bg-green-200/60' : ''}
                    ${isAIFrom ? 'ring-2 ring-blue-400 ring-inset' : ''}
                    ${isAITo ? 'bg-blue-200/60 ring-2 ring-blue-500 ring-inset animate-pulse' : ''}
                  `}
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                >
                  {piece && (
                    <motion.span
                      initial={isAITo ? { scale: 0.8 } : false}
                      animate={isAITo ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.45 }}
                      className={`font-bold ${
                        piece.color === 'red' ? 'text-red-600' : 'text-gray-800'
                      } bg-amber-50 rounded-full flex items-center justify-center border-2 ${
                        piece.color === 'red' ? 'border-red-400' : 'border-gray-500'
                      } shadow-sm`}
                      style={{
                        width: `${Math.floor(cellSize * 0.76)}px`,
                        height: `${Math.floor(cellSize * 0.76)}px`,
                        fontSize: `${Math.max(20, Math.floor(cellSize * 0.5))}px`,
                      }}
                    >
                      {showCutePiece ? (
                        <span
                          className={`relative flex items-center justify-center rounded-full bg-gradient-to-b ${CUTE_PIECES[label]?.bg ?? 'from-amber-50 to-amber-100'} ${CUTE_PIECES[label]?.border ?? 'border-amber-200'} border w-full h-full`}
                          title={`${CUTE_PIECES[label]?.icon ?? ''} ${label}`}
                        >
                          <span className="absolute -top-1 text-[0.55em]">{CUTE_PIECES[label]?.icon ?? '🐾'}</span>
                          <span className="mt-1 font-black leading-none">{CUTE_PIECES[label]?.label ?? label}</span>
                        </span>
                      ) : label}
                    </motion.span>
                  )}
                  {valid && !piece && <div className="w-3 h-3 rounded-full bg-green-400/60" />}
                </button>
              )
            })

            // 楚河漢界獨立一列
            if (r === 4) {
              return (
                <Fragment key={`row-${r}`}>
                  {rowCells}
                  <div
                    className="col-span-9 flex items-center justify-center border-x border-b border-amber-400/60 bg-amber-50/70 text-amber-700 font-bold tracking-[0.3em]"
                    style={{ height: `${Math.floor(cellSize * 0.95)}px`, fontSize: `${Math.max(16, Math.floor(cellSize * 0.42))}px` }}
                  >
                    楚河　漢界
                  </div>
                </Fragment>
              )
            }

            return rowCells
          })}
        </div>
      </div>

      {lastAIMove && (
        <p className="text-xs text-warm-text-light">
          電腦剛剛移動：({lastAIMove.from[0] + 1},{lastAIMove.from[1] + 1}) → ({lastAIMove.to[0] + 1},{lastAIMove.to[1] + 1})
        </p>
      )}
    </div>
  )
}
