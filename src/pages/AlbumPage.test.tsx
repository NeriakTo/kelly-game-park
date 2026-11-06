import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { COLLECTION_STORAGE_KEY, DINO_COLLECTION, PIECES_PER_DINO } from '../games/dino-shop/types'

// 我的收藏冊：首頁「我的收藏冊」連過來的簡單頁面，列出恐龍商店收集到的化石。
// 資料只讀恐龍商店存在本機儲存的收藏（kelly-dino-collection），不另外存。

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

function saveCollection(pieces: Record<string, number>, totalCorrect: number) {
  const data = {
    fossils: DINO_COLLECTION.map((d) => ({
      dinoId: d.id,
      dinoName: d.name,
      dinoEmoji: d.emoji,
      totalPieces: PIECES_PER_DINO,
      collectedPieces: pieces[d.id] ?? 0,
    })),
    totalCorrect,
    stageProgress: {},
  }
  localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(data))
}

describe('我的收藏冊', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('測試中不得連外'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('首頁的收藏冊卡片連到收藏冊頁，頁面有標題與回首頁', async () => {
    renderAt('/album')
    expect(await screen.findByRole('heading', { name: '我的收藏冊' }, { timeout: 5000 })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: '回首頁' }).length).toBeGreaterThan(0)
  })

  it('列出六隻恐龍各收集了幾片，集滿 5 片的標示完成；每隻都有畫（不是表情符號）', async () => {
    saveCollection({ trex: 5, bronto: 2 }, 21)
    renderAt('/album')
    const list = await screen.findByRole('list', { name: '化石收藏' }, { timeout: 5000 })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(DINO_COLLECTION.length)

    expect(within(list).getByLabelText('暴龍，5 片都找到了，完成！')).toBeTruthy()
    expect(within(list).getByLabelText('雷龍，找到 2 片，還差 3 片')).toBeTruthy()
    expect(within(list).getByLabelText('三角龍，還沒找到')).toBeTruthy()
    for (const item of items) expect(item.querySelector('svg')).not.toBeNull()
    for (const d of DINO_COLLECTION) expect(list.textContent).not.toContain(d.emoji)
  })

  it('上方有總數：一共幾片、答對幾題', async () => {
    saveCollection({ trex: 5, bronto: 2 }, 21)
    renderAt('/album')
    expect(await screen.findByText(/一共找到 7 片化石/, {}, { timeout: 5000 })).toBeTruthy()
    expect(screen.getByText(/在恐龍商店答對 21 題/)).toBeTruthy()
  })

  it('還沒收集時，提示去恐龍商店，並有按鈕過去', async () => {
    renderAt('/album')
    expect(await screen.findByText(/去恐龍商店答對題目，就能挖到化石/, {}, { timeout: 5000 })).toBeTruthy()
    expect(screen.getByRole('link', { name: /去恐龍商店/ }).getAttribute('href')).toBe('/dino-shop')
  })
})
