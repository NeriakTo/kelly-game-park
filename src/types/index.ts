export type Difficulty = 1 | 2 | 3 | 4 | 5

// [FIX Warning #5] 收斂 gameType 為 union
export type GameType = 'sudoku' | 'chess' | 'memory' | 'typing' | 'math' | '2048'

export const AVAILABLE_DIFFICULTIES: Difficulty[] = [1, 2, 3]

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: '國小低年級',
  2: '國小中年級',
  3: '國小高年級',
  4: '國小高年級',
  5: '國小高年級',
}

export const DIFFICULTY_STARS: Record<Difficulty, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐',
  5: '⭐⭐⭐',
}

export interface GameInfo {
  id: string
  name: string
  description: string
  icon: string
  color: string
  path: string
  available: boolean
}

export interface GameScore {
  id: string
  gameType: GameType
  difficulty: Difficulty
  score: number
  durationSeconds: number
  playedAt: string
}

export interface PlayerProfile {
  nickname: string
  avatar: string
}

export interface AIConfig {
  provider: 'openai' | 'gemini'
  apiKey: string
}
