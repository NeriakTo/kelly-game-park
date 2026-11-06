import type { Level } from '../data/levels'

// 遊戲內部的難度參數（1 到 5）。孩子看到的是選關的簡單、普通、挑戰，對照見 data/levelMap.ts。
export type Difficulty = 1 | 2 | 3 | 4 | 5

// [FIX Warning #5] 收斂 gameType 為 union
export type GameType = 'sudoku' | 'chess' | 'memory' | 'typing' | 'math' | 'dino-shop' | 'go'

export interface GameScore {
  id: string
  gameType: GameType
  difficulty: Difficulty
  score: number
  durationSeconds: number
  playedAt: string
  /** 在哪一關玩的；改版前的舊紀錄沒有這一欄 */
  level?: Level
}

export interface PlayerProfile {
  nickname: string
  avatar: string
}

export interface AIConfig {
  provider: 'openai' | 'gemini'
  apiKey: string
}
