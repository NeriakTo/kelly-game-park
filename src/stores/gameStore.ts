import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty, GameScore, GameType, PlayerProfile, AIConfig } from '../types'
import { getActiveSession } from './activeSession'
import { isValidPasscode } from '../services/ai'

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

// 設定版本：第 1 版起 AI 改走網站伺服器，瀏覽器只存家用通行碼。
// 第 0 版把 AI 服務選擇與金鑰存在瀏覽器兩個地方：主設定裡的 aiConfig（很早的版本整包存），
// 以及獨立的 kelly-game-park-ai（localStorage 與 sessionStorage 各一份）。升版時兩處都刪掉。
const STORE_VERSION = 1
const LEGACY_AI_KEY = 'kelly-game-park-ai'

function purgeLegacyAIStorage() {
  try { localStorage.removeItem(LEGACY_AI_KEY) } catch { /* 無法存取本機儲存就算了 */ }
  try { sessionStorage.removeItem(LEGACY_AI_KEY) } catch { /* 同上 */ }
}

/** 只留合格的通行碼；其他欄位（例如舊的 provider、apiKey）一律丟掉 */
function sanitizeAIConfig(value: unknown): AIConfig | null {
  if (!value || typeof value !== 'object') return null
  const passcode = (value as { passcode?: unknown }).passcode
  return typeof passcode === 'string' && isValidPasscode(passcode) ? { passcode } : null
}

type PersistedGame = Pick<GameState, 'profile' | 'scores' | 'aiModes' | 'aiConfig'>

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
      version: STORE_VERSION,
      partialize: (state) => ({
        profile: state.profile,
        scores: state.scores,
        aiModes: state.aiModes,
        aiConfig: state.aiConfig,
      }),
      // 第 0 版 → 第 1 版：舊的 aiConfig 是 { provider, apiKey }，不能轉成通行碼，整個丟掉；
      // 全站難度 currentDifficulty 也不用了。zustand 升版後會把結果寫回本機儲存，舊金鑰的原文就不在了。
      migrate: (persisted) => {
        const { aiConfig: _oldAI, currentDifficulty: _oldDifficulty, ...rest } = (persisted ?? {}) as Record<string, unknown>
        // 其餘欄位交給下面的 merge 逐一檢查，這裡只負責拿掉舊欄位
        return { ...rest, aiConfig: null } as unknown as PersistedGame
      },
      merge: (persisted, current) => {
        // 只取認得的欄位；舊版的全站難度、金鑰之類一律不進記憶體
        const incoming = (persisted ?? {}) as Partial<Record<keyof GameState, unknown>>
        return {
          ...current,
          profile: (incoming.profile as PlayerProfile | undefined) ?? current.profile,
          scores: (incoming.scores as GameScore[] | undefined) ?? current.scores,
          aiModes: {
            ...DEFAULT_AI_MODES,
            ...((incoming.aiModes as Partial<GameAIModes> | undefined) ?? {}),
          },
          aiConfig: sanitizeAIConfig(incoming.aiConfig),
        }
      },
      // 每次讀回設定後都清一次獨立存放的舊金鑰（就算主設定已經是新版，也可能還留著）
      onRehydrateStorage: () => () => purgeLegacyAIStorage(),
    },
  ),
)
