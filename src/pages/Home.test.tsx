import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { useGameStore } from '../stores/gameStore'
import { useProgressStore } from '../stores/progressStore'

// 新首頁：繼續上次的遊戲、四個分區、收藏冊、家長鎖；遊戲卡片顯示星星進度。

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

function continueBanner() {
  return screen.getByRole('region', { name: '繼續上次的遊戲' })
}

describe('首頁：繼續上次的遊戲', () => {
  beforeEach(() => {
    useGameStore.setState({ aiConfig: null, scores: [] })
    useProgressStore.setState({ bestStars: {}, lastPlayed: null })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('測試中不得連外'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('還沒玩過任何遊戲時，沒有「繼續玩」，改成邀請去下棋', () => {
    renderAt('/')
    const banner = continueBanner()
    expect(within(banner).queryByRole('link', { name: /繼續玩/ })).toBeNull()
    expect(within(banner).getByRole('link', { name: /去下棋/ }).getAttribute('href')).toBe('/chess')
  })

  it('玩過記憶翻牌普通關，回首頁就看到「繼續上次的遊戲：記憶翻牌」，點了直接回到普通關', async () => {
    renderAt('/memory/normal')
    await screen.findAllByRole('button', { name: /^翻牌 第\d+張$/ }, { timeout: 5000 })

    fireEvent.click(screen.getByRole('link', { name: '回首頁' }))

    const banner = continueBanner()
    expect(within(banner).getByText(/記憶翻牌/)).toBeTruthy()
    expect(within(banner).getByText(/普通/)).toBeTruthy()
    const go = within(banner).getByRole('link', { name: /繼續玩/ })
    expect(go.getAttribute('href')).toBe('/memory/normal')

    fireEvent.click(go)
    const cards = await screen.findAllByRole('button', { name: /^翻牌 第\d+張$/ }, { timeout: 5000 })
    expect(cards).toHaveLength(12)
  })

  it('最後玩的遊戲會存起來，重新開網頁還記得', async () => {
    const first = renderAt('/sudoku/hard')
    await screen.findByRole('heading', { name: '數獨' }, { timeout: 5000 })
    first.unmount()

    const saved = JSON.parse(localStorage.getItem('kelly-game-park-progress') ?? '{}')
    expect(saved.state.lastPlayed).toMatchObject({ game: 'sudoku', level: 'hard' })

    renderAt('/')
    expect(within(continueBanner()).getByRole('link', { name: /繼續玩/ }).getAttribute('href')).toBe('/sudoku/hard')
  })

  it('只看選關畫面、沒有開始玩，不算玩過', async () => {
    const view = renderAt('/chess')
    await screen.findByRole('navigation', { name: '選關卡' }, { timeout: 5000 })
    view.unmount()

    renderAt('/')
    expect(within(continueBanner()).queryByRole('link', { name: /繼續玩/ })).toBeNull()
  })
})

describe('首頁：分區、星星與入口', () => {
  beforeEach(() => {
    useProgressStore.setState({ bestStars: {}, lastPlayed: null })
  })

  it('四個分區與 7 個遊戲、收藏冊都在；打字標「用筆電玩」', () => {
    renderAt('/')
    const zones: Record<string, string[]> = {
      下棋: ['象棋', '圍棋'],
      動動腦: ['數獨', '記憶翻牌'],
      算一算: ['數學挑戰', '恐龍商店'],
    }
    for (const [zone, games] of Object.entries(zones)) {
      const region = screen.getByRole('region', { name: zone })
      for (const g of games) {
        expect(within(region).getByRole('link', { name: new RegExp(`^${g}，`) })).toBeTruthy()
      }
    }
    expect(screen.getByRole('link', { name: /^練打字，要用筆電玩/ }).getAttribute('href')).toBe('/typing')
    expect(screen.getByRole('link', { name: /^我的收藏冊/ }).getAttribute('href')).toBe('/album')
  })

  it('遊戲還沒回報時卡片是空星；回報後顯示最好的一關', () => {
    const view = renderAt('/')
    expect(screen.getByRole('link', { name: /^數獨，還沒有星星/ })).toBeTruthy()
    view.unmount()

    useProgressStore.getState().reportStars('sudoku', 'easy', 3)
    useProgressStore.getState().reportStars('sudoku', 'hard', 1)
    renderAt('/')
    expect(screen.getByRole('link', { name: /^數獨，拿到 3 顆星/ })).toBeTruthy()
  })

  it('右上角的鎖頭進到家長驗證；首頁沒有任何設定入口', async () => {
    renderAt('/')
    expect(screen.queryByRole('link', { name: /設定/ })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: /家長區/ }))
    expect(await screen.findByRole('button', { name: '按住 3 秒進入家長區' }, { timeout: 5000 })).toBeTruthy()
  })

  it('松松跟孩子打招呼', () => {
    renderAt('/')
    expect(screen.getByRole('img', { name: '陪玩角色松松' })).toBeTruthy()
    expect(screen.getByText('今天想玩什麼呢？')).toBeTruthy()
  })
})
