import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty, GameScore, GameType, PlayerProfile, AIConfig } from '../types'
import { getActiveSession } from './activeSession'

type AIToggleGame = 'math' | 'dino-shop' | 'chess' | 'go'
export type GameAIModes = Record<AIToggleGame, 'ai' | 'local'>

interface GameState {
  profile: PlayerProfile
  scores: GameScore[]
  aiConfig: AIConfig | null
  aiModes: GameAIModes

  setProfile: (profile: PlayerProfile) => void
  addScore: (score: { gameType: GameType; difficulty: Difficulty; score: number; durationSeconds: number }) => void
  setAIConfig: (config: AIConfig | null) => void
  setAIMode: (game: AIToggleGame, mode: 'ai' | 'local') => void
}

const DEFAULT_AI_MODES: GameAIModes = {
  math: 'local',
  'dino-shop': 'local',
  chess: 'ai',
  go: 'ai',
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: { nickname: '悅悅', avatar: '🐱' },
      scores: [],
      aiConfig: null,
      aiModes: DEFAULT_AI_MODES,

      setProfile: (profile) => set({ profile }),
      addScore: (score) =>
        set((state) => {
          // 補上正在玩的關卡（遊戲本身只知道內部難度），家長區才能顯示「數獨・簡單」
          const session = getActiveSession()
          const level = session && session.game === score.gameType ? session.level : undefined
          return {
            scores: [
              ...state.scores,
              { ...score, id: crypto.randomUUID(), playedAt: new Date().toISOString(), ...(level ? { level } : {}) },
            ],
          }
        }),
      setAIConfig: (aiConfig) => set({ aiConfig }),
      setAIMode: (game, mode) => {
        set((state) => ({ aiModes: { ...state.aiModes, [game]: mode } }))
      },
    }),
    {
      name: 'kelly-game-park',
      partialize: (state) => ({
        profile: state.profile,
        scores: state.scores,
        aiModes: state.aiModes,
      }),
      merge: (persisted, current) => {
        // 舊版存過全站難度 currentDifficulty，改版後不用了，讀進來時丟掉
        const { currentDifficulty: _legacy, ...incoming } = (persisted as Partial<GameState> & { currentDifficulty?: unknown }) ?? {}
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
