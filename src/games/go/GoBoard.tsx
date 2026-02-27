import { useMemo } from 'react'
import type { Board, Position, GoState } from './types'
import { getGroup, getCell, isIllegalMove } from './engine'
import GoStone from './GoStone'

interface GoBoardProps {
  readonly state: GoState
  readonly onCellClick: (pos: Position) => void
  readonly disabled?: boolean
  readonly showIllegalMoves?: boolean
  readonly highlightPositions?: readonly Position[]
}

// 9×9 星位
const STAR_POINTS_9: readonly Position[] = [
  [2, 2], [2, 6],
  [4, 4],
  [6, 2], [6, 6],
]

function posKey(pos: Position): string {
  return `${pos[0]},${pos[1]}`
}

export default function GoBoard({
  state,
  onCellClick,
  disabled = false,
  showIllegalMoves = true,
  highlightPositions = [],
}: GoBoardProps) {
  const { board, boardSize, lastMove } = state

  // 找出 1 氣群（危險提示）
  const dangerStones = useMemo(() => {
    const danger = new Set<string>()
    const visited = new Set<string>()
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const key = `${r},${c}`
        if (visited.has(key) || !board[r][c]) continue
        const group = getGroup(board, [r, c])
        for (const s of group.stones) visited.add(posKey(s))
        if (group.liberties.length === 1) {
          for (const s of group.stones) danger.add(posKey(s))
        }
      }
    }
    return danger
  }, [board, boardSize])

  // 找出禁著點
  const illegalMoves = useMemo(() => {
    if (!showIllegalMoves) return new Set<string>()
    const illegal = new Set<string>()
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (getCell(board, [r, c]) !== null) continue
        if (isIllegalMove(state, [r, c])) {
          illegal.add(`${r},${c}`)
        }
      }
    }
    return illegal
  }, [board, boardSize, state, showIllegalMoves])

  const highlightSet = useMemo(
    () => new Set(highlightPositions.map(posKey)),
    [highlightPositions],
  )

  const starPoints = boardSize === 9 ? STAR_POINTS_9 : []
  const starSet = new Set(starPoints.map(posKey))

  // 響應式格子大小
  const cellSize = `min(calc((100vw - 32px) / ${boardSize}), 48px)`

  return (
    <div
      className="inline-grid relative rounded-lg p-2"
      style={{
        gridTemplateColumns: `repeat(${boardSize}, ${cellSize})`,
        gridTemplateRows: `repeat(${boardSize}, ${cellSize})`,
        background: 'linear-gradient(135deg, #DEB887 0%, #D2A870 50%, #C49A6C 100%)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {Array.from({ length: boardSize * boardSize }, (_, i) => {
        const r = Math.floor(i / boardSize)
        const c = i % boardSize
        const pos: Position = [r, c]
        const key = posKey(pos)
        const cell = getCell(board, pos)
        const isLast = lastMove !== null && lastMove[0] === r && lastMove[1] === c
        const isDanger = dangerStones.has(key)
        const isIllegal = illegalMoves.has(key)
        const isHighlighted = highlightSet.has(key)
        const isStar = starSet.has(key)

        return (
          <button
            key={key}
            onClick={() => !disabled && onCellClick(pos)}
            disabled={disabled}
            className="relative flex items-center justify-center"
            style={{ width: cellSize, height: cellSize }}
          >
            {/* 格線 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* 水平線 */}
              <div
                className="absolute h-px bg-black/50"
                style={{
                  left: c === 0 ? '50%' : 0,
                  right: c === boardSize - 1 ? '50%' : 0,
                  top: '50%',
                }}
              />
              {/* 垂直線 */}
              <div
                className="absolute w-px bg-black/50"
                style={{
                  top: r === 0 ? '50%' : 0,
                  bottom: r === boardSize - 1 ? '50%' : 0,
                  left: '50%',
                }}
              />
              {/* 星位 */}
              {isStar && !cell && (
                <div className="absolute w-2 h-2 rounded-full bg-black/60" />
              )}
            </div>

            {/* 棋子 */}
            {cell && (
              <GoStone
                color={cell}
                isLastMove={isLast}
                isInDanger={isDanger}
                size={parseInt(cellSize) || 40}
              />
            )}

            {/* 禁著點標記 */}
            {!cell && isIllegal && (
              <div className="absolute text-red-400/60 text-xs font-bold pointer-events-none">
                ✕
              </div>
            )}

            {/* 高亮標記 */}
            {!cell && isHighlighted && (
              <div className="absolute w-3 h-3 rounded-full bg-green-400/50 pointer-events-none animate-pulse" />
            )}
          </button>
        )
      })}
    </div>
  )
}
