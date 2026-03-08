import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty, GameScore, GameType, PlayerProfile, AIConfig } from '../types'

type AIToggleGame = 'math' | 'dino-shop' | 'chess' | 'go'
export type GameAIModes = Record<AIToggleGame, 'ai' | 'local'>

interface GameState {
  profile: PlayerProfile
  scores: GameScore[]
  aiConfig: AIConfig | null
  aiModes: GameAIModes
  currentDifficulty: Difficulty

  setProfile: (profile: PlayerProfile) => void
  setDifficulty: (d: Difficulty) => void
  addScore: (score: { gameType: GameType; difficulty: Difficulty; score: number; durationSeconds: number }) => void
  setAIConfig: (config: AIConfig | null) => void
  setAIMode: (game: AIToggleGame, mode: 'ai' | 'local') => void
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

const DEFAULT_AI_MODES: GameAIModes = {
  math: 'ai',
  'dino-shop': 'ai',
  chess: 'ai',
  go: 'ai',
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: { nickname: 'Kelly', avatar: '🐱' },
      scores: [],
      aiConfig: readAIConfigFromBrowser(),
      aiModes: DEFAULT_AI_MODES,
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
      setAIMode: (game, mode) => {
        set((state) => ({ aiModes: { ...state.aiModes, [game]: mode } }))
      },
    }),
    {
      name: 'kelly-game-park',
      partialize: (state) => ({
        profile: state.profile,
        scores: state.scores,
        currentDifficulty: state.currentDifficulty,
        aiModes: state.aiModes,
      }),
      merge: (persisted, current) => {
        const incoming = (persisted as Partial<GameState>) ?? {}
        return {
          ...current,
          ...incoming,
          aiModes: {
            ...DEFAULT_AI_MODES,
            ...(incoming.aiModes ?? {}),
          },
        }
      },
    },
  ),
)
