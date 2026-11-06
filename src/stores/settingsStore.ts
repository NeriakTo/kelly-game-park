import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Grade } from '../games/math/generators'
import type { GameType } from '../types'
import type { Level } from '../data/levels'

// 家長區的設定：年級、各遊戲推薦關卡、AI 陪玩下棋。存在本機儲存，跟遊戲成績分開放。

export interface CompanionSettings {
  /** AI 陪玩下棋（第二階段才做，這裡先存設定） */
  readonly enabled: boolean
  /** 陪玩時要不要講解每一步 */
  readonly explain: boolean
}

interface SettingsState {
  grade: Grade
  /** 各遊戲的推薦關卡；沒設定的遊戲不標推薦 */
  recommendedLevels: Partial<Record<GameType, Level>>
  companion: CompanionSettings

  setGrade: (grade: Grade) => void
  setRecommendedLevel: (game: GameType, level: Level | null) => void
  setCompanion: (patch: Partial<CompanionSettings>) => void
}

export const DEFAULT_GRADE: Grade = 3

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      grade: DEFAULT_GRADE,
      recommendedLevels: {},
      companion: { enabled: false, explain: true },

      setGrade: (grade) => set({ grade }),
      setRecommendedLevel: (game, level) =>
        set((s) => {
          const next = { ...s.recommendedLevels }
          if (level) next[game] = level
          else delete next[game]
          return { recommendedLevels: next }
        }),
      setCompanion: (patch) => set((s) => ({ companion: { ...s.companion, ...patch } })),
    }),
    {
      name: 'kelly-game-park-settings',
      partialize: (s) => ({ grade: s.grade, recommendedLevels: s.recommendedLevels, companion: s.companion }),
    },
  ),
)
