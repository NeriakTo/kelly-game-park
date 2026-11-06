import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import { useGameStore } from '../../stores/gameStore'

// 家長區：長按 3 秒或答對一題兩位數乘法才進得去；通過後 10 分鐘內不用再驗。
// 判斷「進去了沒」：家長區內容的「年級」標題出現＝進去了；只看到驗證畫面＝沒進去。

const T0 = new Date('2026-11-06T10:00:00+08:00').getTime()

function renderParent() {
  return render(
    <MemoryRouter initialEntries={['/parent']}>
      <App />
    </MemoryRouter>,
  )
}

async function waitForGate() {
  return screen.findByRole('button', { name: '按住 3 秒進入家長區' }, { timeout: 5000 })
}

function settingsShown(): boolean {
  return screen.queryByRole('heading', { name: '年級' }) !== null
}

function readQuestion(): number {
  const text = screen.getByTestId('gate-question').textContent ?? ''
  const m = text.match(/(\d{2})\s*×\s*(\d{2})/)
  if (!m) throw new Error(`看不懂題目：${text}`)
  return Number(m[1]) * Number(m[2])
}

function answer(value: number) {
  fireEvent.change(screen.getByLabelText('答案'), { target: { value: String(value) } })
  fireEvent.click(screen.getByRole('button', { name: '確認' }))
}

describe('家長區驗證', () => {
  beforeEach(() => {
    useGameStore.setState({ aiConfig: null, scores: [] })
    vi.spyOn(Date, 'now').mockReturnValue(T0)
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('測試中不得連外'))))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('沒驗證前只看到驗證畫面，看不到家長設定', async () => {
    renderParent()
    await waitForGate()
    expect(settingsShown()).toBe(false)
  })

  it('長按未滿 3 秒放開，不能進入', async () => {
    renderParent()
    const hold = await waitForGate()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    fireEvent.pointerDown(hold)
    act(() => {
      vi.advanceTimersByTime(2900)
    })
    fireEvent.pointerUp(hold)
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(settingsShown()).toBe(false)
    expect(screen.getByRole('button', { name: '按住 3 秒進入家長區' })).toBeTruthy()
  })

  it('長按滿 3 秒，進入家長區', async () => {
    renderParent()
    const hold = await waitForGate()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    fireEvent.pointerDown(hold)
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(settingsShown()).toBe(true)
  })

  it('乘法算錯，不能進入，並換一題', async () => {
    renderParent()
    await waitForGate()
    const right = readQuestion()

    answer(right + 1)

    expect(settingsShown()).toBe(false)
    expect(screen.getByText('答案不對，請再算一次')).toBeTruthy()
  })

  it('乘法算對，進入家長區', async () => {
    renderParent()
    await waitForGate()

    answer(readQuestion())

    expect(settingsShown()).toBe(true)
  })

  it('通過後 10 分鐘內再進來不用再驗，超過 10 分鐘要重新驗', async () => {
    const first = renderParent()
    await waitForGate()
    answer(readQuestion())
    expect(settingsShown()).toBe(true)
    first.unmount()

    vi.spyOn(Date, 'now').mockReturnValue(T0 + 9 * 60 * 1000)
    const second = renderParent()
    expect(await screen.findByRole('heading', { name: '年級' }, { timeout: 5000 })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '按住 3 秒進入家長區' })).toBeNull()
    second.unmount()

    vi.spyOn(Date, 'now').mockReturnValue(T0 + 11 * 60 * 1000)
    renderParent()
    await waitForGate()
    expect(settingsShown()).toBe(false)
  })
})
