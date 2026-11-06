import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { isTouchOnlyDevice } from '../utils/device'

// 打字：偵測到觸控裝置而且沒有實體鍵盤（例如沒接鍵盤的 iPad）時，進打字遊戲先顯示
// 「這個遊戲要用筆電玩喔」與回首頁鍵；筆電照常可玩。
// 瀏覽器沒辦法直接問「有沒有接鍵盤」，所以用「只有手指、沒有滑鼠或觸控板」來判斷，
// 而且在這個畫面按下任何實體按鍵就當作有鍵盤，直接放行。

function fakeDevice({ touchPoints, coarse, hover }: { touchPoints: number; coarse: boolean; hover: boolean }) {
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: touchPoints, configurable: true })
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches:
      (query.includes('pointer: coarse') && coarse) ||
      (query.includes('hover: hover') && hover),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

const IPAD = { touchPoints: 5, coarse: true, hover: false }
const LAPTOP = { touchPoints: 0, coarse: false, hover: true }
const IPAD_WITH_TRACKPAD = { touchPoints: 5, coarse: false, hover: true }

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('打字：觸控裝置沒有鍵盤時的提示', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('測試中不得連外'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(window.navigator, 'maxTouchPoints')
  })

  it('判斷：沒接鍵盤的 iPad 算觸控裝置；筆電、接了觸控板的 iPad 不算', () => {
    fakeDevice(IPAD)
    expect(isTouchOnlyDevice()).toBe(true)
    fakeDevice(LAPTOP)
    expect(isTouchOnlyDevice()).toBe(false)
    fakeDevice(IPAD_WITH_TRACKPAD)
    expect(isTouchOnlyDevice()).toBe(false)
  })

  it('iPad 進打字：顯示「這個遊戲要用筆電玩喔」與回首頁，不顯示選關', async () => {
    fakeDevice(IPAD)
    renderAt('/typing')
    expect(await screen.findByText('這個遊戲要用筆電玩喔', {}, { timeout: 5000 })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: '回首頁' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('navigation', { name: '選關卡' })).toBeNull()
  })

  it('iPad 從「繼續玩」直接進打字某一關，一樣先看到提示', async () => {
    fakeDevice(IPAD)
    renderAt('/typing/easy')
    expect(await screen.findByText('這個遊戲要用筆電玩喔', {}, { timeout: 5000 })).toBeTruthy()
    expect(document.querySelector('[data-game-root]')).toBeNull()
  })

  it('在提示畫面按下實體鍵盤的鍵，就當作有鍵盤，進到選關', async () => {
    fakeDevice(IPAD)
    renderAt('/typing')
    await screen.findByText('這個遊戲要用筆電玩喔', {}, { timeout: 5000 })
    fireEvent.keyDown(window, { key: 'a' })
    expect(await screen.findByRole('navigation', { name: '選關卡' })).toBeTruthy()
  })

  it('筆電照常：直接看到選關，選了就能玩', async () => {
    fakeDevice(LAPTOP)
    renderAt('/typing/easy')
    await screen.findByRole('heading', { name: '練打字' }, { timeout: 5000 })
    expect(screen.queryByText('這個遊戲要用筆電玩喔')).toBeNull()
    expect(document.querySelectorAll('[data-game-root="typing"]')).toHaveLength(1)
  })
})
