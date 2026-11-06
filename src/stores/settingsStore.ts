import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Grade } from '../games/math/generators'

// 家長區的設定：年級、AI 陪玩下棋。存在本機儲存，跟遊戲成績分開放。

export interface CompanionSettings {
  /** AI 陪玩下棋（第二階段才做，這裡先存設定） */
  readonly enabled: boolean
  /** 陪玩時要不要講解每一步 */
  readonly explain: boolean
}

interface SettingsState {
  grade: Grade
  companion: CompanionSettings

  setGrade: (grade: Grade) => void
  setCompanion: (patch: Partial<CompanionSettings>) => void
}

export const DEFAULT_GRADE: Grade = 3

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      grade: DEFAULT_GRADE,
      companion: { enabled: false, explain: true },

      setGrade: (grade) => set({ grade }),
      setCompanion: (patch) => set((s) => ({ companion: { ...s.companion, ...patch } })),
    }),
    {
      name: 'kelly-game-park-settings',
      partialize: (s) => ({ grade: s.grade, companion: s.companion }),
    },
  ),
)
