import type { Difficulty } from '../../types'

type Board = (number | null)[][]

/** Generate a complete valid Sudoku board */
function generateComplete(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(null))

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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
    puzzle[r][c] = null
    removed++
  }

  return { puzzle, solution }
}

export function checkBoard(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === null) return false
    }
  }
  // Check rows, cols, boxes
  for (let i = 0; i < 9; i++) {
    const row = new Set(board[i])
    const col = new Set(board.map((r) => r[i]))
    if (row.size !== 9 || col.size !== 9) return false
  }
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
