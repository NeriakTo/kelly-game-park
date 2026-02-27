import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, RotateCcw, Flag, Undo2, Eye, EyeOff } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import type { GoState, Position, GoProgress } from './types'
import { GO_PROGRESS_KEY } from './types'
import {
  createInitialState,
  placeStone,
  pass,
  getAIMove,
  scoreGame,
  opponent,
  getGroup,
  getCell,
} from './engine'
import GoBoard from './GoBoard'
import HintBubble from './HintBubble'

interface PlayModeProps {
  readonly onBack: () => void
}

type GamePhase = 'playing' | 'ai-thinking' | 'game-over'

function loadProgress(): GoProgress {
  try {
    const raw = localStorage.getItem(GO_PROGRESS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { completedLessons: [], gamesPlayed: 0, gamesWon: 0 }
}

function saveProgress(progress: GoProgress): void {
  try {
    localStorage.setItem(GO_PROGRESS_KEY, JSON.stringify(progress))
  } catch {}
}

export default function PlayMode({ onBack }: PlayModeProps) {
  const difficulty = useGameStore((s) => s.currentDifficulty)
  const addScore = useGameStore((s) => s.addScore)

  const [state, setState] = useState<GoState>(() => createInitialState(9))
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [hint, setHint] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(true)
  const [undoStack, setUndoStack] = useState<GoState[]>([])
  const [scores, setScores] = useState<{ black: number; white: number } | null>(null)

  const startTimeRef = useRef(Date.now())
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const playerColor = 'black' as const
  const aiColor = 'white' as const

  // AI 回合 — phase 用 ref 讀取，避免 setPhase 觸發 cleanup 清掉 timer
  useEffect(() => {
    if (phaseRef.current !== 'playing' || state.currentTurn !== aiColor) return

    setPhase('ai-thinking')
    const timer = setTimeout(() => {
      const move = getAIMove(state, difficulty)
      if (move) {
        const result = placeStone(state, move)
        if (result) {
          setState(result)
          if (showHints) {
            const capturedCount = result.captures[aiColor] - state.captures[aiColor]
            if (capturedCount > 0) {
              setHint(`白棋吃掉了 ${capturedCount} 顆黑棋！注意防守。`)
            } else {
              setHint(null)
            }
          }
          setPhase('playing')
          return
        }
      }
      // AI pass
      const passedState = pass(state)
      setState(passedState)
      if (passedState.consecutivePasses >= 2) {
        endGame(passedState)
      } else {
        setHint('白棋選擇 Pass。')
        setPhase('playing')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [state, aiColor, difficulty, showHints])

  const endGame = useCallback(
    (finalState: GoState) => {
      const result = scoreGame(finalState.board)
      setScores(result)
      setPhase('game-over')

      const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
      const playerWon = result.black > result.white
      const score = playerWon ? Math.max(100, 500 - duration) : Math.max(50, 200 - duration)

      addScore({
        gameType: 'go',
        difficulty,
        score,
        durationSeconds: duration,
      })

      const progress = loadProgress()
      const updated: GoProgress = {
        ...progress,
        gamesPlayed: progress.gamesPlayed + 1,
        gamesWon: progress.gamesWon + (playerWon ? 1 : 0),
      }
      saveProgress(updated)
    },
    [addScore, difficulty],
  )

  const handleCellClick = useCallback(
    (pos: Position) => {
      if (phase !== 'playing' || state.currentTurn !== playerColor) return

      const result = placeStone(state, pos)
      if (!result) {
        if (showHints) setHint('這裡不能下喔！可能是禁著點或打劫。')
        return
      }

      // 即時規則提示
      if (showHints) {
        const capturedCount = result.captures[playerColor] - state.captures[playerColor]
        if (capturedCount > 0) {
          setHint(`吃掉了 ${capturedCount} 顆白棋！太厲害了！`)
        } else {
          // 檢查己方是否有 1 氣群
          let hasAtari = false
          for (let r = 0; r < result.boardSize; r++) {
            for (let c = 0; c < result.boardSize; c++) {
              if (getCell(result.board, [r, c]) === playerColor) {
                const group = getGroup(result.board, [r, c])
                if (group.liberties.length === 1) {
                  hasAtari = true
                  break
                }
              }
            }
            if (hasAtari) break
          }
          setHint(hasAtari ? '小心！你有棋子快要被吃掉了，注意紅色標記！' : null)
        }
      }

      setUndoStack((prev) => [...prev, state])
      setState(result)
    },
    [state, phase, playerColor, showHints],
  )

  const handlePass = useCallback(() => {
    if (phase !== 'playing' || state.currentTurn !== playerColor) return
    setUndoStack((prev) => [...prev, state])
    const passedState = pass(state)
    setState(passedState)
    if (passedState.consecutivePasses >= 2) {
      endGame(passedState)
    }
  }, [state, phase, playerColor, endGame])

  const handleUndo = useCallback(() => {
    if (undoStack.length < 2) return // 需要撤回玩家和AI兩步
    const prev = undoStack[undoStack.length - 2]
    setUndoStack((s) => s.slice(0, -2))
    setState(prev)
    setHint(null)
  }, [undoStack])

  const handleResign = useCallback(() => {
    endGame(state)
  }, [state, endGame])

  const handleRestart = useCallback(() => {
    setState(createInitialState(9))
    setPhase('playing')
    setHint(null)
    setUndoStack([])
    setScores(null)
    startTimeRef.current = Date.now()
  }, [])

  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      {/* 標題列 */}
      <div className="flex items-center justify-between bg-wood-light/60 rounded-xl px-3 py-2">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-wood/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-warm-text" />
        </button>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-black inline-block" />
            <span className="font-medium">黑(你)</span>
            <span className="text-warm-text-light">提:{state.captures.black}</span>
          </span>
          <span className="text-warm-text-light">vs</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-white border border-gray-300 inline-block" />
            <span className="font-medium">白(AI)</span>
            <span className="text-warm-text-light">提:{state.captures.white}</span>
          </span>
        </div>
        <button
          onClick={() => setShowHints(!showHints)}
          className="p-1 rounded-lg hover:bg-wood/30 transition-colors"
          title={showHints ? '關閉提示' : '開啟提示'}
        >
          {showHints ? (
            <Eye className="w-5 h-5 text-warm-text" />
          ) : (
            <EyeOff className="w-5 h-5 text-warm-text-light" />
          )}
        </button>
      </div>

      {/* AI 思考提示 */}
      {phase === 'ai-thinking' && (
        <div className="text-center text-sm text-warm-text-light animate-pulse">
          白棋正在思考中...
        </div>
      )}

      {/* 棋盤 */}
      <div className="flex justify-center">
        <GoBoard
          state={state}
          onCellClick={handleCellClick}
          disabled={phase !== 'playing' || state.currentTurn !== playerColor}
          showIllegalMoves={showHints}
        />
      </div>

      {/* 提示泡泡 */}
      {showHints && hint && (
        <div className="flex justify-center">
          <HintBubble message={hint} autoDismiss={3000} onDismiss={() => setHint(null)} />
        </div>
      )}

      {/* 遊戲結束 */}
      {phase === 'game-over' && scores && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 rounded-2xl p-5 text-center space-y-3"
        >
          <h3 className="text-xl font-bold">
            {scores.black > scores.white ? '🎉 你贏了！' : scores.black < scores.white ? '白棋贏了！' : '平手！'}
          </h3>
          <div className="flex justify-center gap-6 text-sm">
            <span>黑：{scores.black} 目</span>
            <span>白：{scores.white} 目</span>
          </div>
          <button
            onClick={handleRestart}
            className="px-5 py-2 rounded-xl font-bold bg-wood text-white hover:bg-wood/90 transition-colors"
          >
            再玩一局
          </button>
        </motion.div>
      )}

      {/* 操作按鈕 */}
      {phase !== 'game-over' && (
        <div className="flex justify-center gap-2 flex-wrap">
          <button
            onClick={handlePass}
            disabled={phase !== 'playing' || state.currentTurn !== playerColor}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-white border border-warm-text-light/30 text-warm-text hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            Pass
          </button>
          <button
            onClick={handleResign}
            disabled={phase !== 'playing'}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-white border border-warm-text-light/30 text-warm-text hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            <Flag className="w-3.5 h-3.5" />
            認輸
          </button>
          <button
            onClick={handleUndo}
            disabled={phase !== 'playing' || undoStack.length < 2}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-white border border-warm-text-light/30 text-warm-text hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
            悔棋
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-white border border-warm-text-light/30 text-warm-text hover:bg-gray-50 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重新開始
          </button>
        </div>
      )}
    </div>
  )
}
