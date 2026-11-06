import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import MathChallengeGame from './math/MathChallengeGame'
import DinoShopGame from './dino-shop/DinoShopGame'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { GameSessionContext, type GameSession } from '../components/GameShell/session'
import type { Level } from '../data/levels'

// 遊戲畫面接上伺服器出題：數學送出的是畫面上那個單元的真實資料與由關卡換算的難度；
// 伺服器的題目真的會出現在畫面上；伺服器回錯誤或連不上時照舊出題，孩子看不到任何錯誤字樣。
// fetch 一律是假的，不會連外。

const FAMILY = { passcode: 'family-test-2026' }
// 不比對 502、503 這類數字：畫面上的選項數字串在一起時（例如 358、350）會誤判
const ADULT_TEXT = /AI|API|CORS|HTTP|[Ee]rror|本地題庫|出題來源|來源：|出題模式|課綱|[NRSD]-\d-\d|錯誤|失敗|伺服器|逾時|通行碼|金鑰/

const AI_MATH = { text: '小熊有 23 盒餅乾，每盒 3 塊，一共幾塊？', answer: 69, hint: '先算 20 × 3', unitId: 'g3-multiply', curriculumTag: 'N-3-3' }

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function inSession(game: GameSession['game'], level: Level, children: ReactNode) {
  const session: GameSession = { game, level, reportResult: () => {} }
  return <GameSessionContext.Provider value={session}>{children}</GameSessionContext.Provider>
}

function optionButtons(): HTMLElement[] {
  return screen.getAllByRole('button').filter((b) => /^\d+(\.\d+)?$/.test(b.textContent?.trim() ?? ''))
}

function shownProblem(): string {
  return screen.getByTestId('math-problem').querySelector('[data-problem-text]')?.textContent ?? ''
}

function sentBody(mock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  return JSON.parse(String((mock.mock.calls[0][1] as RequestInit).body))
}

function setAI(mode: 'ai' | 'local', config: { passcode: string } | null) {
  useGameStore.setState((s) => ({ aiConfig: config, aiModes: { ...s.aiModes, math: mode, 'dino-shop': mode } }))
}

describe('數學挑戰接上伺服器出題', () => {
  beforeEach(() => {
    useSettingsStore.setState({ grade: 3 })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('挑戰關：送出三年級第一個單元的真實資料、難度 4，伺服器的題目出現在第 2 題', async () => {
    setAI('ai', FAMILY)
    const mock = vi.fn(async (_url: string, _init?: RequestInit) => json(200, AI_MATH))
    vi.stubGlobal('fetch', mock)
    render(inSession('math', 'hard', <MathChallengeGame />))

    await waitFor(() => expect(mock).toHaveBeenCalled())
    expect(mock.mock.calls[0][0]).toBe(`${import.meta.env.BASE_URL}api/ai/math`)
    expect(new Headers((mock.mock.calls[0][1] as RequestInit).headers).get('X-Family-Passcode')).toBe('family-test-2026')
    expect(sentBody(mock)).toEqual({
      gradeBand: 'grade-3',
      unitId: 'g3-multiply',
      unitName: '多位數乘法',
      unitDescription: '二三位數乘以一位數',
      curriculumTag: 'N-3-3',
      difficulty: 4,
    })

    await act(async () => {})
    fireEvent.click(optionButtons()[0])
    await waitFor(() => expect(shownProblem()).toBe(AI_MATH.text), { timeout: 3000 })
    expect(document.body.textContent).not.toMatch(ADULT_TEXT)
  })

  it('簡單關：一律出簡單題，送給伺服器的難度是 1', async () => {
    setAI('ai', FAMILY)
    const mock = vi.fn(async (_url: string, _init?: RequestInit) => json(200, AI_MATH))
    vi.stubGlobal('fetch', mock)
    render(inSession('math', 'easy', <MathChallengeGame />))
    await waitFor(() => expect(mock).toHaveBeenCalled())
    expect(sentBody(mock).difficulty).toBe(1)
  })

  it('家長區關掉 AI 出題：就算有通行碼也不呼叫伺服器', async () => {
    setAI('local', FAMILY)
    const mock = vi.fn(async (_url: string, _init?: RequestInit) => json(200, AI_MATH))
    vi.stubGlobal('fetch', mock)
    render(inSession('math', 'normal', <MathChallengeGame />))
    await act(async () => {})
    expect(mock).not.toHaveBeenCalled()
  })

  it('開了 AI 出題但沒有通行碼：不呼叫伺服器', async () => {
    setAI('ai', null)
    const mock = vi.fn(async (_url: string, _init?: RequestInit) => json(200, AI_MATH))
    vi.stubGlobal('fetch', mock)
    render(inSession('math', 'normal', <MathChallengeGame />))
    await act(async () => {})
    expect(mock).not.toHaveBeenCalled()
  })

  it.each([
    ['502', () => json(502, { error: 'upstream' })],
    ['503', () => json(503, { error: 'disabled' })],
    ['429', () => json(429, { error: 'daily_limit' })],
    ['連不上', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('伺服器%s：照舊出下一題，畫面沒有錯誤字樣', async (_label, respond) => {
    setAI('ai', FAMILY)
    const mock = vi.fn(async (_url: string, _init?: RequestInit) => respond())
    vi.stubGlobal('fetch', mock)
    render(inSession('math', 'hard', <MathChallengeGame />))
    await waitFor(() => expect(mock).toHaveBeenCalled())
    await act(async () => {})

    const first = shownProblem()
    fireEvent.click(optionButtons()[0])
    await waitFor(() => expect(screen.getByText(/題號：/).textContent).toBe('題號：2/10'), { timeout: 3000 })
    expect(shownProblem()).not.toBe('')
    expect(shownProblem()).not.toBe(AI_MATH.text)
    expect(first).not.toBe('')
    expect(optionButtons()).toHaveLength(4)
    expect(document.body.textContent).not.toMatch(ADULT_TEXT)
  })
})

describe('恐龍商店接上伺服器出題', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    ['502', () => json(502, { error: 'upstream' })],
    ['503', () => json(503, { error: 'disabled' })],
    ['429', () => json(429, { error: 'busy' })],
    ['連不上', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('伺服器%s：畫面沒有錯誤字樣', async (_label, respond) => {
    setAI('ai', FAMILY)
    vi.stubGlobal('fetch', vi.fn(async (_url: string, _init?: RequestInit) => respond()))
    render(inSession('dino-shop', 'normal', <DinoShopGame />))
    await act(async () => {})
    await act(async () => {})
    expect(document.body.textContent).not.toMatch(ADULT_TEXT)
  })
})
