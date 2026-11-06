import { createContext, useContext } from 'react'
import type { GameType, Difficulty } from '../../types'
import type { Level } from '../../data/levels'
import { levelToDifficulty } from '../../data/levelMap'
import type { StarCount } from '../../stores/progressStore'

// 遊戲場次：外框告訴遊戲「現在是哪一關」，遊戲過關時用 reportResult 回報星星（第二階段接上）。

export interface GameSession {
  readonly game: GameType
  readonly level: Level
  /** 過關時呼叫：記下最佳星星數並打開過關畫面 */
  readonly reportResult: (stars: Exclude<StarCount, 0>) => void
}

export const GameSessionContext = createContext<GameSession | null>(null)

export function useGameSession(): GameSession | null {
  return useContext(GameSessionContext)
}

/** 遊戲取得自己的難度參數。不在外框裡（例如單獨測試遊戲元件）時當作簡單。 */
export function useGameDifficulty(game: GameType): Difficulty {
  const session = useContext(GameSessionContext)
  return levelToDifficulty(game, session?.level ?? 'easy')
}

export function useGameLevel(): Level {
  return useContext(GameSessionContext)?.level ?? 'easy'
}
