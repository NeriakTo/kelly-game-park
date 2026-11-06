import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AISection from './AISection'
import { useGameStore } from '../../../stores/gameStore'

// 家長區 AI 區：AI 改由網站伺服器呼叫，瀏覽器不再填金鑰、不選服務；
// 改成輸入一次「家用通行碼」（只收英數字與 -，8～64 字，輸入時遮住、可切換顯示），可以儲存、可以檢查。
// 「檢查」呼叫 api/ai/status，五種結果各有一句話。fetch 一律是假的。

const STATUS_URL = `${import.meta.env.BASE_URL}api/ai/status`

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function renderSection() {
  return render(
    <MemoryRouter>
      <AISection />
    </MemoryRouter>,
  )
}

function passcodeInput(): HTMLInputElement {
  return screen.getByLabelText('家用通行碼') as HTMLInputElement
}

function typePasscode(value: string) {
  fireEvent.change(passcodeInput(), { target: { value } })
}

describe('家長區 AI 區：家用通行碼', () => {
  beforeEach(() => {
    useGameStore.setState({ aiConfig: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('沒有服務選單、金鑰欄位，也不提 OpenAI、Gemini、金鑰；四個開關照舊', () => {
    const { container } = renderSection()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(container.textContent).not.toMatch(/OpenAI|Gemini|金鑰|API Key|供應商/)
    for (const name of ['數學挑戰用 AI 出題', '恐龍商店用 AI 出題', '讓 AI 陪孩子下棋', '陪玩時講解每一步']) {
      expect(screen.getByRole('switch', { name })).toBeTruthy()
    }
  })

  it('通行碼輸入時遮住，可以切換顯示', () => {
    renderSection()
    expect(passcodeInput().type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: '顯示通行碼' }))
    expect(passcodeInput().type).toBe('text')
    fireEvent.click(screen.getByRole('button', { name: '隱藏通行碼' }))
    expect(passcodeInput().type).toBe('password')
  })

  it.each([
    ['有中文', '我家的通行碼1234'],
    ['有空白', 'family code 2026'],
    ['太短（7 字）', 'abc1234'],
    ['太長（65 字）', 'a'.repeat(65)],
  ])('格式不對（%s）：不儲存，告訴家長規則', (_label, value) => {
    renderSection()
    typePasscode(value)
    fireEvent.click(screen.getByRole('button', { name: '儲存' }))
    expect(screen.getByRole('alert').textContent).toMatch(/英文字母、數字和 -.*8 到 64 字/)
    expect(useGameStore.getState().aiConfig).toBeNull()
  })

  it('格式正確：儲存到這台裝置', () => {
    renderSection()
    typePasscode('family-2026-abc')
    fireEvent.click(screen.getByRole('button', { name: '儲存' }))
    expect(useGameStore.getState().aiConfig).toEqual({ passcode: 'family-2026-abc' })
    expect(screen.getByText('已儲存')).toBeTruthy()
  })

  it('已經存過的通行碼會帶進輸入框（遮住）', () => {
    useGameStore.setState({ aiConfig: { passcode: 'saved-code-1234' } })
    renderSection()
    expect(passcodeInput().value).toBe('saved-code-1234')
    expect(passcodeInput().type).toBe('password')
  })

  it('格式不對時按「檢查」：不呼叫伺服器', () => {
    const mock = vi.fn(async () => json(200, { enabled: true, remainingToday: 1, dailyLimit: 300 }))
    vi.stubGlobal('fetch', mock)
    renderSection()
    typePasscode('短')
    fireEvent.click(screen.getByRole('button', { name: '檢查' }))
    expect(mock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  describe('「檢查」的五種結果', () => {
    async function check(respond: () => Promise<Response>) {
      const mock = vi.fn(respond)
      vi.stubGlobal('fetch', mock)
      renderSection()
      typePasscode('family-2026-abc')
      fireEvent.click(screen.getByRole('button', { name: '檢查' }))
      const status = await screen.findByRole('status')
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock.mock.calls[0][0]).toBe(STATUS_URL)
      const init = (mock.mock.calls[0][1] ?? {}) as RequestInit
      expect(init.method ?? 'GET').toBe('GET')
      expect(new Headers(init.headers).get('X-Family-Passcode')).toBe('family-2026-abc')
      return status.textContent ?? ''
    }

    it('200 而且有開：通行碼正確，今天還能出 N 題', async () => {
      expect(await check(async () => json(200, { enabled: true, remainingToday: 287, dailyLimit: 300 }))).toBe(
        '通行碼正確，今天還能出 287 題',
      )
    })

    it('200 但沒開：AI 服務目前沒有開', async () => {
      expect(await check(async () => json(200, { enabled: false, remainingToday: 300, dailyLimit: 300 }))).toBe(
        'AI 服務目前沒有開',
      )
    })

    it('401：通行碼不對', async () => {
      expect(await check(async () => json(401, { error: 'passcode' }))).toBe('通行碼不對')
    })

    it('429 鎖住：錯太多次，請 15 分鐘後再試', async () => {
      expect(await check(async () => json(429, { error: 'locked' }))).toBe('錯太多次，請 15 分鐘後再試')
    })

    it.each([
      ['404（例如 GitHub 舊站）', async () => json(404, { error: 'not_found' })],
      ['回的是網頁不是 JSON', async () => new Response('<!doctype html>', { status: 200 })],
      ['連不上', async () => Promise.reject(new TypeError('Failed to fetch'))],
    ])('其他（%s）：這個網址沒有 AI 服務', async (_label, respond) => {
      expect(await check(respond as () => Promise<Response>)).toBe('這個網址沒有 AI 服務')
    })
  })

  it('檢查結果顯示在 AI 區裡，不影響開關', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: 'passcode' })))
    renderSection()
    typePasscode('family-2026-abc')
    fireEvent.click(screen.getByRole('button', { name: '檢查' }))
    const status = await screen.findByRole('status')
    const section = status.closest('section')
    expect(section).not.toBeNull()
    expect(within(section as HTMLElement).getByLabelText('家用通行碼')).toBeTruthy()
  })
})
