import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import GamePage from '../../pages/GamePage'
import { useGameSession } from './session'
import { useProgressStore, starsFor } from '../../stores/progressStore'

// 過關畫面：遊戲用 reportResult(1～3) 回報後，外框打開過關畫面，
// 顯示星星與「再玩一次／下一關／回首頁」；記下最佳星星；系統設定「減少動態效果」時星星不跳動。
// 用一個假遊戲（按「過關」就回報星星）測外框，真的遊戲第二階段才接上。

const sfx = vi.hoisted(() => ({ played: [] as string[] }))
vi.mock('../../audio/sfx', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../audio/sfx')>()
  return { ...real, playSfx: (name: string) => sfx.played.push(name) }
})

let mounts = 0

function FakeGame({ stars }: { stars: 1 | 2 | 3 }) {
  const session = useGameSession()
  const [moves, setMoves] = useState(0)
  useEffect(() => {
    mounts += 1
  }, [])
  return (
    <div>
      <p>走了 {moves} 步</p>
      <button type="button" onClick={() => setMoves((m) => m + 1)}>走一步</button>
      <button type="button" onClick={() => session?.reportResult(stars)}>過關</button>
    </div>
  )
}

function renderGame(path: string, stars: 1 | 2 | 3 = 2) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<h1>首頁</h1>} />
        <Route
          path="/memory/:level?"
          element={
            <GamePage game="memory">
              <FakeGame stars={stars} />
            </GamePage>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

function fakeReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

describe('過關畫面', () => {
  beforeEach(() => {
    mounts = 0
    sfx.played = []
    fakeReducedMotion(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('回報 2 顆星：打開過關畫面，亮 2 顆星，有再玩一次、下一關、回首頁，播過關音效', () => {
    renderGame('/memory/easy', 2)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '過關' }))

    const sheet = screen.getByRole('dialog', { name: /過關了/ })
    expect(within(sheet).getByLabelText('拿到 2 顆星')).toBeTruthy()
    expect(sheet.querySelectorAll('[data-star="filled"]')).toHaveLength(2)
    expect(within(sheet).getByRole('button', { name: '再玩一次' })).toBeTruthy()
    expect(within(sheet).getByRole('link', { name: /下一關/ }).getAttribute('href')).toBe('/memory/normal')
    expect(within(sheet).getByRole('link', { name: '回首頁' }).getAttribute('href')).toBe('/')
    expect(sfx.played).toContain('win')
  })

  it('記下這一關的最佳星星（不會被比較少的覆蓋）', () => {
    renderGame('/memory/easy', 2)
    fireEvent.click(screen.getByRole('button', { name: '過關' }))
    const best = () => starsFor(useProgressStore.getState().bestStars, 'memory', 'easy')
    expect(best()).toBe(2)
    useProgressStore.getState().reportStars('memory', 'easy', 1)
    expect(best()).toBe(2)
  })

  it('再玩一次：關掉過關畫面，遊戲從頭開始', () => {
    renderGame('/memory/easy', 3)
    fireEvent.click(screen.getByRole('button', { name: '走一步' }))
    expect(screen.getByText('走了 1 步')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '過關' }))
    fireEvent.click(screen.getByRole('button', { name: '再玩一次' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('走了 0 步')).toBeTruthy()
    expect(mounts).toBe(2)
  })

  it('下一關：換到普通，遊戲重新開始，過關畫面關掉', () => {
    renderGame('/memory/easy', 1)
    fireEvent.click(screen.getByRole('button', { name: '過關' }))
    fireEvent.click(screen.getByRole('link', { name: /下一關/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('link', { name: /換一關（現在是普通）/ })).toBeTruthy()
  })

  it('挑戰已經是最後一關：沒有「下一關」，其他兩個照常', () => {
    renderGame('/memory/hard', 3)
    fireEvent.click(screen.getByRole('button', { name: '過關' }))
    const sheet = screen.getByRole('dialog', { name: /過關了/ })
    expect(within(sheet).queryByRole('link', { name: /下一關/ })).toBeNull()
    expect(within(sheet).getByRole('button', { name: '再玩一次' })).toBeTruthy()
    expect(within(sheet).getByRole('link', { name: '回首頁' })).toBeTruthy()
  })

  it('一般情況星星會一顆顆跳出來', () => {
    renderGame('/memory/easy', 3)
    fireEvent.click(screen.getByRole('button', { name: '過關' }))
    expect(screen.getByRole('dialog').querySelectorAll('.star-pop').length).toBeGreaterThan(0)
  })

  it('設定「減少動態效果」時星星直接出現、不跳動', () => {
    fakeReducedMotion(true)
    renderGame('/memory/easy', 3)
    fireEvent.click(screen.getByRole('button', { name: '過關' }))
    const sheet = screen.getByRole('dialog')
    expect(sheet.querySelectorAll('[data-star="filled"]')).toHaveLength(3)
    expect(sheet.querySelectorAll('.star-pop')).toHaveLength(0)
  })
})
