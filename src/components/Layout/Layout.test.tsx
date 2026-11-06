import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useEffect, type ReactElement } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import App from '../../App'
import { useGameStore } from '../../stores/gameStore'

// jsdom 不套用 Tailwind 樣式，被 CSS 藏起來的那份也會出現在 DOM 裡，
// 所以這裡數得到的份數就是實際掛載的份數。

function PageProbe() {
  return <div data-testid="page-probe">頁面內容</div>
}

// 模擬「一進頁面就記一筆成績」的遊戲（打字練完一課的情境）
function ScoreOnMount() {
  const addScore = useGameStore((s) => s.addScore)
  useEffect(() => {
    addScore({ gameType: 'typing', difficulty: 1, score: 100, durationSeconds: 10 })
  }, [addScore])
  return null
}

function renderInLayout(page: ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/probe']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="probe" element={page} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('外框 Layout：頁面內容只渲染一次', () => {
  beforeEach(() => {
    useGameStore.setState({ scores: [], currentDifficulty: 1 })
  })

  it('路由頁面只掛載一份', () => {
    renderInLayout(<PageProbe />)
    expect(screen.getAllByTestId('page-probe')).toHaveLength(1)
  })

  it('掛載時記成績的頁面只記一筆', () => {
    renderInLayout(<ScoreOnMount />)
    expect(useGameStore.getState().scores).toHaveLength(1)
  })

  it('記憶翻牌難度 1（4 對）畫面上只有 8 張卡片', async () => {
    render(
      <MemoryRouter initialEntries={['/memory']}>
        <App />
      </MemoryRouter>,
    )
    const cards = await screen.findAllByRole('button', { name: /^翻牌 第\d+張$/ }, { timeout: 5000 })
    expect(cards).toHaveLength(4 * 2)
  })
})
