import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import DinoShopGame from './DinoShopGame'
import { useGameStore } from '../../stores/gameStore'
import { GameSessionContext, type GameSession } from '../../components/GameShell/session'
import type { ShopQuestion } from './types'

// 恐龍商店接上伺服器出題，走完「預先要下一題 → 答題 → 下一題」整段。
// 商店的題型是隨機抽的，有些題型（點商品、硬幣面板）不會問 AI；這裡把本機題目固定成一定會問 AI 的題型，
// 才測得到伺服器失敗時孩子看到的下一題。fetch 一律是假的，不會連外。

const FIXED: ShopQuestion = {
  type: 'multiple-items',
  description: '🍪 恐龍餅乾每個 3 元，買 4 個要多少元？',
  items: [{ id: 'food1', name: '恐龍餅乾', emoji: '🍪', price: 3, category: 'food' }],
  targetAmount: 12,
  options: [10, 12, 14, 16],
  hint: '3 × 4 = ?',
  answer: 12,
}

// 每次出題的說明都加上編號：店長換句是靠說明文字分辨的，前後兩題一模一樣時淡出淡入偶爾卡住，測試會不穩
let made = 0
vi.mock('./data', async (importOriginal) => {
  const original = await importOriginal<typeof import('./data')>()
  return { ...original, generateQuestion: (): ShopQuestion => ({ ...FIXED, description: `${FIXED.description}（第 ${++made} 盒）` }) }
})
const LOCAL_SHOWN = /恐龍餅乾每個 3 元，買 4 個要多少元？（第 \d+ 盒）/

const FAMILY = { passcode: 'family-test-2026' }
const ADULT_TEXT = /AI|API|CORS|HTTP|[Ee]rror|本地題庫|出題來源|來源：|出題模式|錯誤|失敗|伺服器|逾時|通行碼|金鑰/
const AI_SHOP = { description: '小暴龍買了 2 個 15 元的化石，一共多少元？', answer: 30, hint: '15 + 15', options: [25, 30, 35] }

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function renderGame() {
  const session: GameSession = { game: 'dino-shop', level: 'normal', reportResult: () => {} }
  return render(
    <GameSessionContext.Provider value={session}>
      <DinoShopGame />
    </GameSessionContext.Provider>,
  )
}

async function answerFirstAndGoNext(mock: ReturnType<typeof vi.fn>) {
  await waitFor(() => expect(mock).toHaveBeenCalled())
  await act(async () => {})
  fireEvent.click(screen.getByRole('button', { name: /^12 元$/ }))
  // 像孩子一樣先看完「答對了」再按下一題：店長換句有 0.2 秒淡出淡入，
  // 在測試環境裡換句動畫還沒跑完就再換一次，舊的那句偶爾會卡住不走
  await waitFor(() => expect(document.body.textContent).toContain('答對了'))
  await new Promise((resolve) => setTimeout(resolve, 400))
  fireEvent.click(await screen.findByRole('button', { name: /下一題/ }))
  await act(async () => {})
}

describe('恐龍商店：伺服器出題走完一整段', () => {
  beforeEach(() => {
    useGameStore.setState((s) => ({ aiConfig: FAMILY, aiModes: { ...s.aiModes, 'dino-shop': 'ai' } }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('伺服器出的題目出現在第 2 題；送出的本文只有 stage 與 difficulty', async () => {
    const mock = vi.fn(async (_url: string, _init?: RequestInit) => json(200, AI_SHOP))
    vi.stubGlobal('fetch', mock)
    renderGame()
    await answerFirstAndGoNext(mock)

    expect(mock.mock.calls[0][0]).toBe(`${import.meta.env.BASE_URL}api/ai/shop`)
    expect(JSON.parse(String((mock.mock.calls[0][1] as RequestInit).body))).toEqual({ stage: 'A', difficulty: 2 })
    expect(screen.getByText('2/8')).toBeTruthy()
    // 店長的話換句時有 0.2 秒的淡出淡入，等新的那句出現
    await waitFor(() => expect(document.body.textContent).toContain(AI_SHOP.description))
    expect(document.body.textContent).not.toMatch(ADULT_TEXT)
  })

  it.each([
    ['502', () => json(502, { error: 'upstream' })],
    ['503', () => json(503, { error: 'disabled' })],
    ['429', () => json(429, { error: 'busy' })],
    ['連不上', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('伺服器%s：第 2 題照舊用本機題目，畫面沒有錯誤字樣', async (_label, respond) => {
    const mock = vi.fn(async (_url: string, _init?: RequestInit) => respond())
    vi.stubGlobal('fetch', mock)
    renderGame()
    await answerFirstAndGoNext(mock)

    expect(screen.getByText('2/8')).toBeTruthy()
    await waitFor(() => expect(document.body.textContent).toMatch(LOCAL_SHOWN))
    expect(document.body.textContent).not.toMatch(ADULT_TEXT)
  })
})
