import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Grade } from '../games/math/generators'
import type { GameType } from '../types'
import type { Level } from '../data/levels'

// 家長區的設定：年級、各遊戲推薦關卡、聲音開關與音量、AI 陪玩下棋。存在本機儲存，跟遊戲成績分開放。

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
  /** 聲音開關（首頁與遊戲頁右上角一鍵切換） */
  soundOn: boolean
  /** 音量 0 到 1；預設小聲 */
  volume: number
  companion: CompanionSettings

  setSoundOn: (on: boolean) => void
  setVolume: (volume: number) => void
  setGrade: (grade: Grade) => void
  setRecommendedLevel: (game: GameType, level: Level | null) => void
  setCompanion: (patch: Partial<CompanionSettings>) => void
}

export const DEFAULT_GRADE: Grade = 3
export const DEFAULT_VOLUME = 0.35

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      grade: DEFAULT_GRADE,
      recommendedLevels: {},
      soundOn: true,
      volume: DEFAULT_VOLUME,
      companion: { enabled: false, explain: true },

      setSoundOn: (soundOn) => set({ soundOn }),
      setVolume: (volume) => set({ volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_VOLUME }),

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
      partialize: (s) => ({
        grade: s.grade,
        recommendedLevels: s.recommendedLevels,
        soundOn: s.soundOn,
        volume: s.volume,
        companion: s.companion,
      }),
    },
  ),
)
