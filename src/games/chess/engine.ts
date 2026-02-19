import type { Difficulty } from '../../types'

// Chinese Chess (Xiangqi) engine
// Board: 10 rows × 9 cols, Red (bottom) vs Black (top)

export type PieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P' // 將/士/象/馬/車/炮/兵
export type PieceColor = 'red' | 'black'

export interface Piece {
  type: PieceType
  color: PieceColor
}

export type ChessBoard = (Piece | null)[][]
export type Position = [number, number] // [row, col]

const PIECE_NAMES: Record<PieceColor, Record<PieceType, string>> = {
  red: { K: '帥', A: '仕', E: '相', H: '傌', R: '俥', C: '炮', P: '兵' },
  black: { K: '將', A: '士', E: '象', H: '馬', R: '車', C: '砲', P: '卒' },
}

export function getPieceName(piece: Piece): string {
  return PIECE_NAMES[piece.color][piece.type]
}

export function createInitialBoard(): ChessBoard {
  const board: ChessBoard = Array.from({ length: 10 }, () => Array(9).fill(null))

  // Black pieces (top, rows 0-4)
  const backRow: PieceType[] = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R']
  backRow.forEach((type, c) => { board[0][c] = { type, color: 'black' } })
  board[2][1] = { type: 'C', color: 'black' }
  board[2][7] = { type: 'C', color: 'black' }
  ;[0, 2, 4, 6, 8].forEach((c) => { board[3][c] = { type: 'P', color: 'black' } })

  // Red pieces (bottom, rows 5-9)
  backRow.forEach((type, c) => { board[9][c] = { type, color: 'red' } })
  board[7][1] = { type: 'C', color: 'red' }
  board[7][7] = { type: 'C', color: 'red' }
  ;[0, 2, 4, 6, 8].forEach((c) => { board[6][c] = { type: 'P', color: 'red' } })

  return board
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 10 && c >= 0 && c < 9
}

function inPalace(r: number, _c: number, color: PieceColor): boolean {
  const c = _c
  if (c < 3 || c > 5) return false
  return color === 'red' ? r >= 7 && r <= 9 : r >= 0 && r <= 2
}

function inOwnHalf(r: number, color: PieceColor): boolean {
  return color === 'red' ? r >= 5 : r <= 4
}

export function getValidMoves(board: ChessBoard, row: number, col: number): Position[] {
  const piece = board[row][col]
  if (!piece) return []

  const moves: Position[] = []
  const { type, color } = piece
  const dir = color === 'red' ? -1 : 1 // red moves up, black moves down

  const canMoveTo = (r: number, c: number) => {
    if (!inBounds(r, c)) return false
    const target = board[r][c]
    return !target || target.color !== color
  }

  switch (type) {
    case 'K': // 將/帥 - one step in palace
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = row + dr, nc = col + dc
        if (inPalace(nr, nc, color) && canMoveTo(nr, nc)) moves.push([nr, nc])
      }
      break

    case 'A': // 士/仕 - diagonal in palace
      for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nr = row + dr, nc = col + dc
        if (inPalace(nr, nc, color) && canMoveTo(nr, nc)) moves.push([nr, nc])
      }
      break

    case 'E': // 象/相 - diagonal 2 steps, own half, no blocking
      for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
        const nr = row + dr, nc = col + dc
        const br = row + dr / 2, bc = col + dc / 2
        if (inBounds(nr, nc) && inOwnHalf(nr, color) && !board[br][bc] && canMoveTo(nr, nc))
          moves.push([nr, nc])
      }
      break

    case 'H': // 馬 - L-shape, check blocking
      for (const [dr, dc, br, bc] of [
        [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0],
        [1, 2, 0, 1], [1, -2, 0, -1], [-1, 2, 0, 1], [-1, -2, 0, -1],
      ]) {
        const nr = row + dr, nc = col + dc
        if (inBounds(nr, nc) && !board[row + br][col + bc] && canMoveTo(nr, nc))
          moves.push([nr, nc])
      }
      break

    case 'R': // 車 - straight lines
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        for (let i = 1; i < 10; i++) {
          const nr = row + dr * i, nc = col + dc * i
          if (!inBounds(nr, nc)) break
          if (!board[nr][nc]) { moves.push([nr, nc]); continue }
          if (board[nr][nc]!.color !== color) moves.push([nr, nc])
          break
        }
      }
      break

    case 'C': // 炮 - straight, jump to capture
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        let jumped = false
        for (let i = 1; i < 10; i++) {
          const nr = row + dr * i, nc = col + dc * i
          if (!inBounds(nr, nc)) break
          if (!jumped) {
            if (!board[nr][nc]) moves.push([nr, nc])
            else jumped = true
          } else {
            if (board[nr][nc]) {
              if (board[nr][nc]!.color !== color) moves.push([nr, nc])
              break
            }
          }
        }
      }
      break

    case 'P': // 兵/卒
      // Forward
      if (canMoveTo(row + dir, col)) moves.push([row + dir, col])
      // Sideways after crossing river
      if (!inOwnHalf(row, color)) {
        if (canMoveTo(row, col - 1)) moves.push([row, col - 1])
        if (canMoveTo(row, col + 1)) moves.push([row, col + 1])
      }
      break
  }

  return moves
}

// Simple piece values for evaluation
const PIECE_VALUES: Record<PieceType, number> = {
  K: 10000, R: 600, C: 300, H: 270, E: 30, A: 30, P: 60,
}

function evaluate(board: ChessBoard): number {
  let score = 0
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c]
      if (!p) continue
      const val = PIECE_VALUES[p.type]
      // Bonus for pawns crossing river
      const bonus = p.type === 'P' && !inOwnHalf(r, p.color) ? 40 : 0
      score += (p.color === 'black' ? 1 : -1) * (val + bonus)
    }
  }
  return score
}

function getAllMoves(board: ChessBoard, color: PieceColor): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = []
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c]
      if (p && p.color === color) {
        for (const to of getValidMoves(board, r, c)) {
          moves.push({ from: [r, c], to })
        }
      }
    }
  }
  return moves
}

function applyMove(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const b = board.map((r) => [...r])
  b[to[0]][to[1]] = b[from[0]][from[1]]
  b[from[0]][from[1]] = null
  return b
}

const DEPTH_BY_DIFFICULTY: Record<Difficulty, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }

function minimax(
  board: ChessBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
): number {
  if (depth === 0) return evaluate(board)

  const color = isMaximizing ? 'black' : 'red'
  const moves = getAllMoves(board, color)

  if (isMaximizing) {
    let best = -Infinity
    for (const { from, to } of moves) {
      const next = applyMove(board, from, to)
      best = Math.max(best, minimax(next, depth - 1, alpha, beta, false))
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const { from, to } of moves) {
      const next = applyMove(board, from, to)
      best = Math.min(best, minimax(next, depth - 1, alpha, beta, true))
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

export function getAIMove(
  board: ChessBoard,
  difficulty: Difficulty,
): { from: Position; to: Position } | null {
  const depth = DEPTH_BY_DIFFICULTY[difficulty]
  const moves = getAllMoves(board, 'black')
  if (moves.length === 0) return null

  // Add randomness for lower difficulties
  if (difficulty <= 2 && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  let bestScore = -Infinity
  let bestMove = moves[0]

  for (const move of moves) {
    const next = applyMove(board, move.from, move.to)
    const score = minimax(next, depth - 1, -Infinity, Infinity, false)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

export function isKingCaptured(board: ChessBoard, color: PieceColor): boolean {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c]
      if (p && p.type === 'K' && p.color === color) return false
    }
  }
  return true
}

export { applyMove }
