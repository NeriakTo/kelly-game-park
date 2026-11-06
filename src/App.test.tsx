import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useGameStore } from './stores/gameStore'

// 每個遊戲頁的標題：改版後是遊戲外框頂列的遊戲名稱（不再有 emoji 前綴），
// 名稱照首頁示意稿：象棋、練打字、恐龍商店、圍棋。用它確認遊戲頁真的載入了、而且只有一份。
const GAME_ROUTES = [
  { path: '/sudoku', title: '數獨' },
  { path: '/chess', title: '象棋' },
  { path: '/memory', title: '記憶翻牌' },
  { path: '/typing', title: '練打字' },
  { path: '/math', title: '數學挑戰' },
  { path: '/dino-shop', title: '恐龍商店' },
  { path: '/go', title: '圍棋' },
]

function pageTitle(title: string): RegExp {
  return new RegExp(`^${title}$`)
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App 路由：遊戲頁依路由分開載入', () => {
  beforeEach(() => {
    // 全站難度已拿掉（改成進遊戲前選關），這裡不再設定 currentDifficulty
    useGameStore.setState({ aiConfig: null, scores: [] })
    // 測試不得連外：任何對外請求都會被記下來並失敗
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('測試中不得連外'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('首頁直接顯示，不必等遊戲載入', () => {
    renderAt('/')
    expect(screen.getByText('今天想玩什麼呢？')).toBeTruthy()
    expect(screen.queryByText('載入中…')).toBeNull()
  })

  for (const { path, title } of GAME_ROUTES) {
    it(`${path}：先顯示載入中，載入完成後只出現一份遊戲頁`, async () => {
      renderAt(path)
      expect(screen.getByText('載入中…')).toBeTruthy()

      const heading = await screen.findByRole('heading', { name: pageTitle(title) }, { timeout: 5000 })
      expect(heading).toBeTruthy()
      expect(screen.getAllByRole('heading', { name: pageTitle(title) })).toHaveLength(1)
      expect(screen.queryByText('載入中…')).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })
  }
})
