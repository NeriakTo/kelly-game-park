export type StoneColor = 'black' | 'white'
export type Cell = StoneColor | null
export type Board = readonly (readonly Cell[])[]
export type Position = readonly [number, number]

export interface GoState {
  readonly board: Board
  readonly boardSize: number
  readonly currentTurn: StoneColor
  readonly captures: Readonly<Record<StoneColor, number>>
  readonly history: readonly string[]
  readonly lastMove: Position | null
  readonly consecutivePasses: number
  readonly moveCount: number
}

export interface GroupInfo {
  readonly stones: readonly Position[]
  readonly liberties: readonly Position[]
}

export interface GoProgress {
  readonly completedLessons: readonly string[]
  readonly gamesPlayed: number
  readonly gamesWon: number
}

export const GO_PROGRESS_KEY = 'kelly-go-progress'
