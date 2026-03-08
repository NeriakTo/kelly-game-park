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

// API Key 分離儲存：只存在使用者瀏覽器，不進主 persist
const AI_KEY_STORAGE = 'kelly-game-park-ai'

function readAIConfigFromBrowser(): AIConfig | null {
  try {
    const raw = localStorage.getItem(AI_KEY_STORAGE) ?? sessionStorage.getItem(AI_KEY_STORAGE)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AIConfig
    if (!parsed?.apiKey || !parsed?.provider) return null
    // 舊版 sessionStorage 資料遷移到 localStorage
    try { localStorage.setItem(AI_KEY_STORAGE, JSON.stringify(parsed)) } catch {}
    return parsed
  } catch {
    return null
  }
}

function writeAIConfigToBrowser(config: AIConfig | null) {
  try {
    if (config) {
      const raw = JSON.stringify(config)
      try { localStorage.setItem(AI_KEY_STORAGE, raw) } catch {}
      try { sessionStorage.setItem(AI_KEY_STORAGE, raw) } catch {}
      return
    }

    try { localStorage.removeItem(AI_KEY_STORAGE) } catch {}
    try { sessionStorage.removeItem(AI_KEY_STORAGE) } catch {}
  } catch {}
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: { nickname: 'Kelly', avatar: '🐱' },
      scores: [],
      aiConfig: readAIConfigFromBrowser(),
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
        writeAIConfigToBrowser(aiConfig)
        set({ aiConfig })
      },
    }),
    {
      name: 'kelly-game-park',
      partialize: (state) => ({
        profile: state.profile,
        scores: state.scores,
        currentDifficulty: state.currentDifficulty,
      }),
    },
  ),
)
