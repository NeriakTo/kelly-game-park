import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameType } from '../types'
import type { Level } from '../data/levels'

// 進度資料：每個遊戲每一關拿到的最佳星星數（0 到 3）。
// 遊戲還沒回報時是空的，畫面顯示空星；第二階段各遊戲過關時呼叫 reportStars 回報。

export type StarCount = 0 | 1 | 2 | 3
export type BestStars = Partial<Record<GameType, Partial<Record<Level, StarCount>>>>

interface ProgressState {
  bestStars: BestStars

  reportStars: (game: GameType, level: Level, stars: StarCount) => void
}

function clampStars(n: number): StarCount {
  return Math.max(0, Math.min(3, Math.round(n))) as StarCount
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      bestStars: {},

      reportStars: (game, level, stars) =>
        set((s) => {
          const prev = s.bestStars[game]?.[level] ?? 0
          const next = Math.max(prev, clampStars(stars)) as StarCount
          return { bestStars: { ...s.bestStars, [game]: { ...s.bestStars[game], [level]: next } } }
        }),
    }),
    { name: 'kelly-game-park-progress' },
  ),
)

export function starsFor(best: BestStars, game: GameType, level: Level): StarCount {
  return best[game]?.[level] ?? 0
}

/** 首頁卡片上的星星：各關卡裡最好的一關 */
export function bestOfGame(best: BestStars, game: GameType): StarCount {
  const levels = best[game] ?? {}
  return Math.max(0, ...Object.values(levels).map((n) => n ?? 0)) as StarCount
}
