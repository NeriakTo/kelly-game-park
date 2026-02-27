import type { Difficulty } from '../../types'
import type { Board, Cell, GoState, GroupInfo, Position, StoneColor } from './types'

// ─── 棋盤操作 ───

export function createBoard(size: number): Board {
  return Array.from({ length: size }, () => Array(size).fill(null) as Cell[])
}

export function createInitialState(size: number = 9): GoState {
  return {
    board: createBoard(size),
    boardSize: size,
    currentTurn: 'black',
    captures: { black: 0, white: 0 },
    history: [],
    lastMove: null,
    consecutivePasses: 0,
    moveCount: 0,
  }
}

export function getCell(board: Board, pos: Position): Cell {
  return board[pos[0]][pos[1]]
}

function setCell(board: Board, pos: Position, value: Cell): Board {
  return board.map((row, r) =>
    r === pos[0] ? row.map((cell, c) => (c === pos[1] ? value : cell)) : row,
  )
}

// ─── 鄰居查找 ───

export function getNeighbors(pos: Position, size: number): readonly Position[] {
  const [r, c] = pos
  const neighbors: Position[] = []
  if (r > 0) neighbors.push([r - 1, c])
  if (r < size - 1) neighbors.push([r + 1, c])
  if (c > 0) neighbors.push([r, c - 1])
  if (c < size - 1) neighbors.push([r, c + 1])
  return neighbors
}

// ─── 群組 (BFS flood-fill) ───

export function getGroup(board: Board, pos: Position): GroupInfo {
  const size = board.length
  const color = getCell(board, pos)
  if (!color) return { stones: [], liberties: [] }

  const visited = new Set<string>()
  const stones: Position[] = []
  const liberties: Position[] = []
  const libertiesSet = new Set<string>()
  const queue: Position[] = [pos]
  visited.add(`${pos[0]},${pos[1]}`)

  while (queue.length > 0) {
    const current = queue.shift()!
    stones.push(current)

    for (const neighbor of getNeighbors(current, size)) {
      const key = `${neighbor[0]},${neighbor[1]}`
      if (visited.has(key)) continue
      visited.add(key)

      const cell = getCell(board, neighbor)
      if (cell === color) {
        queue.push(neighbor)
      } else if (cell === null && !libertiesSet.has(key)) {
        libertiesSet.add(key)
        liberties.push(neighbor)
      }
    }
  }

  return { stones, liberties }
}

// ─── 移除群組 (不可變) ───

function removeGroup(board: Board, group: readonly Position[]): Board {
  let newBoard = board
  for (const pos of group) {
    newBoard = setCell(newBoard, pos, null)
  }
  return newBoard
}

// ─── 序列化 / Ko 檢測 ───

export function serializeBoard(board: Board): string {
  return board.map((row) => row.map((c) => (c === 'black' ? 'B' : c === 'white' ? 'W' : '.')).join('')).join('|')
}

function isKo(history: readonly string[], boardStr: string): boolean {
  return history.includes(boardStr)
}

// ─── 對手顏色 ───

export function opponent(color: StoneColor): StoneColor {
  return color === 'black' ? 'white' : 'black'
}

// ─── 落子 ───

export function placeStone(state: GoState, pos: Position): GoState | null {
  const { board, boardSize, currentTurn, captures, history } = state
  const [r, c] = pos

  // 邊界檢查
  if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return null
  // 已有棋子
  if (getCell(board, pos) !== null) return null

  // 放棋
  let newBoard = setCell(board, pos, currentTurn)
  const opp = opponent(currentTurn)
  let newCaptures = { ...captures }

  // 先提對方無氣群
  for (const neighbor of getNeighbors(pos, boardSize)) {
    if (getCell(newBoard, neighbor) === opp) {
      const group = getGroup(newBoard, neighbor)
      if (group.liberties.length === 0) {
        newBoard = removeGroup(newBoard, group.stones)
        newCaptures = {
          ...newCaptures,
          [currentTurn]: newCaptures[currentTurn] + group.stones.length,
        }
      }
    }
  }

  // 判自殺（放完棋且提完對方後，己方仍無氣 = 自殺）
  const selfGroup = getGroup(newBoard, pos)
  if (selfGroup.liberties.length === 0) return null

  // 打劫檢查
  const boardStr = serializeBoard(newBoard)
  if (isKo(history, boardStr)) return null

  return {
    board: newBoard,
    boardSize,
    currentTurn: opp,
    captures: newCaptures,
    history: [...history, boardStr],
    lastMove: pos,
    consecutivePasses: 0,
    moveCount: state.moveCount + 1,
  }
}

// ─── Pass ───

export function pass(state: GoState): GoState {
  return {
    ...state,
    currentTurn: opponent(state.currentTurn),
    consecutivePasses: state.consecutivePasses + 1,
    lastMove: null,
    moveCount: state.moveCount + 1,
  }
}

// ─── 禁著點判定 ───

export function isIllegalMove(state: GoState, pos: Position): boolean {
  return placeStone(state, pos) === null
}

// ─── 所有合法位置 ───

export function getAllLegalMoves(state: GoState): readonly Position[] {
  const moves: Position[] = []
  for (let r = 0; r < state.boardSize; r++) {
    for (let c = 0; c < state.boardSize; c++) {
      const pos: Position = [r, c]
      if (getCell(state.board, pos) === null && !isIllegalMove(state, pos)) {
        moves.push(pos)
      }
    }
  }
  return moves
}

// ─── 數子計分（中國規則） ───

export function scoreGame(board: Board): { black: number; white: number } {
  const size = board.length
  const visited = new Set<string>()
  let blackScore = 0
  let whiteScore = 0

  // 先數棋子
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 'black') blackScore++
      else if (board[r][c] === 'white') whiteScore++
    }
  }

  // Flood-fill 找空域歸屬
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`
      if (visited.has(key) || board[r][c] !== null) continue

      // BFS 找連通空點
      const emptyGroup: Position[] = []
      const queue: Position[] = [[r, c]]
      visited.add(key)
      let touchesBlack = false
      let touchesWhite = false

      while (queue.length > 0) {
        const current = queue.shift()!
        emptyGroup.push(current)

        for (const neighbor of getNeighbors(current, size)) {
          const nKey = `${neighbor[0]},${neighbor[1]}`
          const cell = getCell(board, neighbor)
          if (cell === 'black') touchesBlack = true
          else if (cell === 'white') touchesWhite = true
          else if (!visited.has(nKey)) {
            visited.add(nKey)
            queue.push(neighbor)
          }
        }
      }

      // 只被一方包圍的空域歸該方所有
      if (touchesBlack && !touchesWhite) blackScore += emptyGroup.length
      else if (touchesWhite && !touchesBlack) whiteScore += emptyGroup.length
    }
  }

  return { black: blackScore, white: whiteScore }
}

// ─── AI ───

function isEye(board: Board, pos: Position, color: StoneColor): boolean {
  const size = board.length
  const neighbors = getNeighbors(pos, size)
  // 全部鄰居都是己方棋子
  if (!neighbors.every((n) => getCell(board, n) === color)) return false
  // 對角線（至少 3 個是己方或邊界）
  const [r, c] = pos
  const diags: Position[] = [
    [r - 1, c - 1],
    [r - 1, c + 1],
    [r + 1, c - 1],
    [r + 1, c + 1],
  ]
  let friendlyDiags = 0
  let totalDiags = 0
  for (const [dr, dc] of diags) {
    if (dr < 0 || dr >= size || dc < 0 || dc >= size) {
      friendlyDiags++
      totalDiags++
    } else {
      totalDiags++
      if (getCell(board, [dr, dc]) === color) friendlyDiags++
    }
  }
  return friendlyDiags >= totalDiags - 1
}

function evaluateMove(state: GoState, pos: Position, color: StoneColor): number {
  // 填自己的眼 = 非常差
  if (isEye(state.board, pos, color)) return -10

  const result = placeStone(state, pos)
  if (!result) return -100

  let score = 0
  const opp = opponent(color)

  // 提吃加分
  const captured = result.captures[color] - state.captures[color]
  if (captured > 0) score += 5 * captured

  // 救己方 1 氣群
  for (const neighbor of getNeighbors(pos, state.boardSize)) {
    if (getCell(state.board, neighbor) === color) {
      const group = getGroup(state.board, neighbor)
      if (group.liberties.length === 1) score += 4
    }
  }

  // 威脅對方
  for (const neighbor of getNeighbors(pos, state.boardSize)) {
    if (getCell(result.board, neighbor) === opp) {
      const group = getGroup(result.board, neighbor)
      if (group.liberties.length === 1) score += 3
    }
  }

  // 靠近中央略加分
  const center = (state.boardSize - 1) / 2
  const dist = Math.abs(pos[0] - center) + Math.abs(pos[1] - center)
  score += Math.max(0, 3 - dist * 0.3)

  return score
}

export function getAIMove(state: GoState, difficulty: Difficulty): Position | null {
  const legalMoves = getAllLegalMoves(state)
  if (legalMoves.length === 0) return null

  const aiColor = state.currentTurn

  // Level 1: 隨機（但避免填眼）
  if (difficulty === 1) {
    const nonEyeMoves = legalMoves.filter((pos) => !isEye(state.board, pos, aiColor))
    const pool = nonEyeMoves.length > 0 ? nonEyeMoves : legalMoves
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // Level 2: 優先提吃 > 救己方 > 隨機
  if (difficulty === 2) {
    // 找提吃手
    for (const pos of legalMoves) {
      const result = placeStone(state, pos)
      if (result && result.captures[aiColor] > state.captures[aiColor]) {
        return pos
      }
    }
    // 救 1 氣群
    for (const pos of legalMoves) {
      for (const neighbor of getNeighbors(pos, state.boardSize)) {
        if (getCell(state.board, neighbor) === aiColor) {
          const group = getGroup(state.board, neighbor)
          if (group.liberties.length === 1) return pos
        }
      }
    }
    // 隨機（避免填眼）
    const nonEyeMoves = legalMoves.filter((pos) => !isEye(state.board, pos, aiColor))
    const pool = nonEyeMoves.length > 0 ? nonEyeMoves : legalMoves
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // Level 3: 位置評分 + 少許隨機
  const scored = legalMoves.map((pos) => ({
    pos,
    score: evaluateMove(state, pos, aiColor) + (Math.random() * 2 - 1),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.pos ?? null
}

// ─── 從預設盤面建立 state ───

export function createStateFromSetup(
  size: number,
  setup: readonly { pos: Position; color: StoneColor }[],
  currentTurn: StoneColor = 'black',
): GoState {
  let board = createBoard(size)
  for (const { pos, color } of setup) {
    board = setCell(board, pos, color)
  }
  return {
    board,
    boardSize: size,
    currentTurn,
    captures: { black: 0, white: 0 },
    history: [serializeBoard(board)],
    lastMove: null,
    consecutivePasses: 0,
    moveCount: 0,
  }
}
