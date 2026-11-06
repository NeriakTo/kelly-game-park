import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

// 設定升版：AI 改走網站伺服器後，瀏覽器裡舊的 AI 服務選擇與金鑰不能再留著。
// 舊版存過金鑰的地方有兩個：主設定（很早的版本整包存，含 aiConfig）、
// 以及獨立的 kelly-game-park-ai（localStorage 與 sessionStorage 各一份）。
// 升版後讀回來不能有 provider、apiKey，本機儲存的原文也搜不到舊金鑰；其他資料（暱稱、成績、開關）要留著。

const MAIN_KEY = 'kelly-game-park'
const LEGACY_AI_KEY = 'kelly-game-park-ai'
const OLD_OPENAI_KEY = 'sk-old-secret-openai-123456'
const OLD_GEMINI_KEY = 'AIza-old-secret-gemini-654321'

const OLD_SCORE = { id: 's1', gameType: 'memory', difficulty: 1, score: 80, durationSeconds: 30, playedAt: '2026-11-01T00:00:00.000Z' }

function allStoredText(): string {
  const parts: string[] = []
  for (const store of [localStorage, sessionStorage]) {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i)!
      parts.push(key, store.getItem(key) ?? '')
    }
  }
  return parts.join('\n')
}

function savedMain() {
  return JSON.parse(localStorage.getItem(MAIN_KEY) ?? '{}')
}

describe('設定升版：刪掉舊的 AI 服務選擇與金鑰', () => {
  beforeEach(() => {
    useGameStore.setState({ aiConfig: null, scores: [], profile: { nickname: '悅悅', avatar: '🐱' } })
    localStorage.clear()
    sessionStorage.clear()
  })

  it('舊主設定與獨立金鑰都有：讀回後沒有 provider、apiKey，本機儲存也搜不到舊金鑰；其他資料留著', async () => {
    localStorage.setItem(
      MAIN_KEY,
      JSON.stringify({
        state: {
          profile: { nickname: '小悅', avatar: '🐰' },
          scores: [OLD_SCORE],
          aiConfig: { provider: 'openai', apiKey: OLD_OPENAI_KEY },
          aiModes: { math: 'ai', 'dino-shop': 'local', chess: 'ai', go: 'ai' },
          currentDifficulty: 2,
        },
        version: 0,
      }),
    )
    const legacy = JSON.stringify({ provider: 'gemini', apiKey: OLD_GEMINI_KEY })
    localStorage.setItem(LEGACY_AI_KEY, legacy)
    sessionStorage.setItem(LEGACY_AI_KEY, legacy)

    await useGameStore.persist.rehydrate()

    const state = useGameStore.getState() as unknown as Record<string, unknown>
    expect(state.aiConfig).toBeNull()
    expect(state).not.toHaveProperty('provider')
    expect(state).not.toHaveProperty('apiKey')
    expect(state).not.toHaveProperty('currentDifficulty')

    const text = allStoredText()
    expect(text).not.toContain(OLD_OPENAI_KEY)
    expect(text).not.toContain(OLD_GEMINI_KEY)
    expect(text).not.toMatch(/apiKey|provider/)
    expect(localStorage.getItem(LEGACY_AI_KEY)).toBeNull()
    expect(sessionStorage.getItem(LEGACY_AI_KEY)).toBeNull()

    expect(savedMain().version).toBe(1)
    expect(useGameStore.getState().profile).toEqual({ nickname: '小悅', avatar: '🐰' })
    expect(useGameStore.getState().scores).toEqual([OLD_SCORE])
    expect(useGameStore.getState().aiModes.math).toBe('ai')
  })

  it('只有獨立金鑰（主設定已經是新版）：讀回時一樣刪掉', async () => {
    localStorage.setItem(MAIN_KEY, JSON.stringify({ state: { profile: { nickname: '悅悅', avatar: '🐱' }, scores: [] }, version: 1 }))
    localStorage.setItem(LEGACY_AI_KEY, JSON.stringify({ provider: 'openai', apiKey: OLD_OPENAI_KEY }))
    sessionStorage.setItem(LEGACY_AI_KEY, JSON.stringify({ provider: 'openai', apiKey: OLD_OPENAI_KEY }))

    await useGameStore.persist.rehydrate()

    expect(allStoredText()).not.toContain(OLD_OPENAI_KEY)
    expect(useGameStore.getState().aiConfig).toBeNull()
  })

  it('新版的通行碼：存起來，重新開網頁後還在', async () => {
    useGameStore.getState().setAIConfig({ passcode: 'family-2026-abc' })
    expect(savedMain().state.aiConfig).toEqual({ passcode: 'family-2026-abc' })
    expect(savedMain().version).toBe(1)

    // 模擬重新開網頁：記憶體改掉，再把「重開前」存的內容放回去讀
    const before = localStorage.getItem(MAIN_KEY) ?? ''
    useGameStore.setState({ aiConfig: null })
    localStorage.setItem(MAIN_KEY, before)
    await useGameStore.persist.rehydrate()
    expect(useGameStore.getState().aiConfig).toEqual({ passcode: 'family-2026-abc' })
  })

  it('讀回的通行碼只留 passcode 一個欄位；格式不對的通行碼當作沒有', async () => {
    localStorage.setItem(
      MAIN_KEY,
      JSON.stringify({ state: { aiConfig: { passcode: 'family-2026-abc', apiKey: OLD_OPENAI_KEY } }, version: 1 }),
    )
    await useGameStore.persist.rehydrate()
    expect(useGameStore.getState().aiConfig).toEqual({ passcode: 'family-2026-abc' })

    localStorage.setItem(MAIN_KEY, JSON.stringify({ state: { aiConfig: { passcode: '不合格' } }, version: 1 }))
    await useGameStore.persist.rehydrate()
    expect(useGameStore.getState().aiConfig).toBeNull()
  })
})
