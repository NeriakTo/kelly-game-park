import type { Difficulty } from '../../types'

type Board = (number | null)[][]

function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false
  }
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === num) return false
    }
  }
  return true
}

import { shuffle } from '../../utils/random'

/** Generate a complete valid Sudoku board */
function generateComplete(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(null))

  function fill(pos: number): boolean {
    if (pos === 81) return true
    const row = Math.floor(pos / 9)
    const col = pos % 9
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const num of nums) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num
        if (fill(pos + 1)) return true
        board[row][col] = null
      }
    }
    return false
  }

  fill(0)
  return board
}

// ===== [FIX Critical #5] 唯一解驗證 =====
function countSolutions(board: Board, limit: number = 2): number {
  let count = 0

  function solve(pos: number): boolean {
    if (pos === 81) {
      count++
      return count >= limit // 找到足夠多解就停止
    }
    const row = Math.floor(pos / 9)
    const col = pos % 9
    if (board[row][col] !== null) return solve(pos + 1)

    for (let num = 1; num <= 9; num++) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num
        if (solve(pos + 1)) {
          board[row][col] = null
          return true
        }
        board[row][col] = null
      }
    }
    return false
  }

  solve(0)
  return count
}

const BLANKS_BY_DIFFICULTY: Record<Difficulty, number> = {
  1: 22,
  2: 32,
  3: 38,
  4: 46,
  5: 54,
}

export function generateSudoku(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const solution = generateComplete()
  const puzzle: Board = solution.map((row) => [...row])
  const blanks = BLANKS_BY_DIFFICULTY[difficulty]

  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
  )

  let removed = 0
  for (const [r, c] of positions) {
    if (removed >= blanks) break
    const backup = puzzle[r][c]
    puzzle[r][c] = null

    // [FIX Critical #5] 確保唯一解
    const testBoard = puzzle.map((row) => [...row])
    if (countSolutions(testBoard) !== 1) {
      puzzle[r][c] = backup // 還原，跳過這格
      continue
    }

    removed++
  }

  return { puzzle, solution }
}

// [FIX Warning #1] checkBoard 驗證值域 1-9
export function checkBoard(board: Board): boolean {
  const validSet = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c]
      if (val === null || !validSet.has(val)) return false
    }
  }

  // Check rows, cols
  for (let i = 0; i < 9; i++) {
    const row = new Set(board[i])
    const col = new Set(board.map((r) => r[i]))
    if (row.size !== 9 || col.size !== 9) return false
  }

  // Check boxes
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const box = new Set<number>()
      for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
          box.add(board[r][c]!)
        }
      }
      if (box.size !== 9) return false
    }
  }
  return true
}
