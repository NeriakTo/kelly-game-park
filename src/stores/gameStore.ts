import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty, GameScore, GameType, PlayerProfile, AIConfig } from '../types'

interface GameState {
  profile: PlayerProfile
  scores: GameScore[]
  aiConfig: AIConfig | null
  currentDifficulty: Difficulty

  setProfile: (profile: PlayerProfile) => void
  setDifficulty: (d: Difficulty) => void
  addScore: (score: { gameType: GameType; difficulty: Difficulty; score: number; durationSeconds: number }) => void
  setAIConfig: (config: AIConfig | null) => void
}

// [FIX Warning #4] API Key 分離儲存，不放在主 persist
const AI_KEY_STORAGE = 'kelly-game-park-ai'

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: { nickname: 'Kelly', avatar: '🐱' },
      scores: [],
      aiConfig: null,
      currentDifficulty: 1 as Difficulty,

      setProfile: (profile) => set({ profile }),
      setDifficulty: (currentDifficulty) => set({ currentDifficulty }),
      addScore: (score) =>
        set((state) => ({
          scores: [
            ...state.scores,
            { ...score, id: crypto.randomUUID(), playedAt: new Date().toISOString() },
          ],
        })),
      setAIConfig: (aiConfig) => {
        // API Key 存在獨立 sessionStorage（關閉瀏覽器即清除）
        if (aiConfig) {
          try { sessionStorage.setItem(AI_KEY_STORAGE, JSON.stringify(aiConfig)) } catch {}
        } else {
          try { sessionStorage.removeItem(AI_KEY_STORAGE) } catch {}
        }
        set({ aiConfig })
      },
    }),
    {
      name: 'kelly-game-park',
      partialize: (state) => ({
        profile: state.profile,
        scores: state.scores,
        currentDifficulty: state.currentDifficulty,
        // aiConfig 不持久化到 localStorage
      }),
      onRehydrate: () => {
        return (state) => {
          // 從 sessionStorage 恢復 AI config
          if (state) {
            try {
              const stored = sessionStorage.getItem(AI_KEY_STORAGE)
              if (stored) state.aiConfig = JSON.parse(stored)
            } catch {}
          }
        }
      },
    },
  ),
)
