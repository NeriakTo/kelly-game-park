import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty, GameScore, PlayerProfile, AIConfig } from '../types'

interface GameState {
  profile: PlayerProfile
  scores: GameScore[]
  aiConfig: AIConfig | null
  currentDifficulty: Difficulty

  setProfile: (profile: PlayerProfile) => void
  setDifficulty: (d: Difficulty) => void
  addScore: (score: Omit<GameScore, 'id' | 'playedAt'>) => void
  setAIConfig: (config: AIConfig | null) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: { nickname: 'Kelly', avatar: '🐱' },
      scores: [],
      aiConfig: null,
      currentDifficulty: 1,

      setProfile: (profile) => set({ profile }),
      setDifficulty: (currentDifficulty) => set({ currentDifficulty }),
      addScore: (score) =>
        set((state) => ({
          scores: [
            ...state.scores,
            { ...score, id: crypto.randomUUID(), playedAt: new Date().toISOString() },
          ],
        })),
      setAIConfig: (aiConfig) => set({ aiConfig }),
    }),
    { name: 'kelly-game-park' },
  ),
)
