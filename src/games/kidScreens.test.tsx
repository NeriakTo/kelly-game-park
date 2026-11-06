import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import MathChallengeGame from './math/MathChallengeGame'
import DinoShopGame from './dino-shop/DinoShopGame'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'

// 小孩看不到大人的訊息：數學與恐龍商店開了 AI 出題、而 AI 連不上時，
// 畫面照舊用內建題庫出題，但不能出現出題來源、AI 錯誤訊息、課綱代碼，也不能有切換 AI 的按鈕。
// fetch 換成一定失敗的假函式（等同網路斷了或伺服器連不上），測試不會連外。

const ADULT_TEXT = /AI|API|CORS|本地題庫|出題來源|來源：|出題模式|課綱|[NRSD]-\d-\d/

function kidText(): string {
  return document.body.textContent ?? ''
}

function optionButtons(): HTMLElement[] {
  return screen.getAllByRole('button').filter((b) => /^\d+(\.\d+)?$/.test(b.textContent?.trim() ?? ''))
}

describe('小孩畫面不出現大人的訊息', () => {
  beforeEach(() => {
    useGameStore.setState((s) => ({
      // AI 改走網站伺服器後，瀏覽器只存家用通行碼（不再有服務選擇與金鑰）
      aiConfig: { passcode: 'family-test-2026' },
      aiModes: { ...s.aiModes, math: 'ai', 'dino-shop': 'ai' },
    }))
    useSettingsStore.setState({ grade: 3 })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('數學：AI 連不上時改用內建題庫繼續出題，畫面沒有來源、錯誤訊息或課綱代碼', async () => {
    render(<MathChallengeGame />)
    expect(optionButtons()).toHaveLength(4)

    // 等 AI 預先出題失敗（fetch 被呼叫過＝真的試過 AI），再答一題，讓失敗的那一題換上來
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await act(async () => {})
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    fireEvent.click(optionButtons()[0])
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText(/題號：/).textContent).toBe('題號：2/10')
    expect(optionButtons()).toHaveLength(4)
    expect(kidText()).not.toMatch(ADULT_TEXT)
  })

  it('數學：沒有年級按鈕（年級改由家長區設定），也沒有「AI 出題／本地題庫」切換', () => {
    render(<MathChallengeGame />)
    expect(screen.queryByRole('button', { name: /年級/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /AI 出題|本地題庫/ })).toBeNull()
  })

  it('恐龍商店：開了 AI 出題也看不到出題來源、AI 錯誤訊息與切換按鈕', async () => {
    render(<DinoShopGame />)
    await act(async () => {})
    expect(screen.queryByRole('button', { name: /AI 出題|本地題庫/ })).toBeNull()
    expect(kidText()).not.toMatch(ADULT_TEXT)
  })
})
