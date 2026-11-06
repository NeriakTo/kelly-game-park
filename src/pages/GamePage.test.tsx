import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'

// 進遊戲前先到選關畫面選簡單、普通、挑戰；全站難度（國小低年級到高中）拿掉。
// 用記憶翻牌驗證三段真的對到遊戲的難度參數：難度 1、2、3 分別是 4、6、8 對牌。

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

async function cards() {
  return screen.findAllByRole('button', { name: /^翻牌 第\d+張$/ }, { timeout: 5000 })
}

describe('選關畫面與三段難度', () => {
  beforeEach(() => {
    useGameStore.setState({ aiConfig: null, scores: [] })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('測試中不得連外'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('進遊戲先看到選關畫面：簡單、普通、挑戰三個大按鈕，還沒開始玩', async () => {
    renderAt('/memory')
    const picker = await screen.findByRole('navigation', { name: '選關卡' }, { timeout: 5000 })
    const links = within(picker).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('aria-label')?.split('，')[0])).toEqual(['簡單', '普通', '挑戰'])
    expect(screen.queryAllByRole('button', { name: /^翻牌 第\d+張$/ })).toHaveLength(0)
  })

  it('遊戲頁不再出現全站難度選擇', async () => {
    renderAt('/memory/easy')
    await cards()
    for (const old of ['國小低年級', '國小中年級', '國小高年級', '國中', '高中']) {
      expect(screen.queryByText(new RegExp(old))).toBeNull()
    }
  })

  it('簡單、普通、挑戰分別是 4、6、8 對牌', async () => {
    const expected = { easy: 8, normal: 12, hard: 16 }
    for (const [level, count] of Object.entries(expected)) {
      const view = renderAt(`/memory/${level}`)
      expect(await cards()).toHaveLength(count)
      view.unmount()
    }
  })

  it('在選關畫面點「普通」就進到普通的遊戲', async () => {
    renderAt('/memory')
    const picker = await screen.findByRole('navigation', { name: '選關卡' }, { timeout: 5000 })
    fireEvent.click(within(picker).getByRole('link', { name: /^普通/ }))
    expect(await cards()).toHaveLength(12)
  })

  it('網址裡的關卡看不懂時，回到選關畫面', async () => {
    renderAt('/memory/super')
    expect(await screen.findByRole('navigation', { name: '選關卡' }, { timeout: 5000 })).toBeTruthy()
  })

  it('家長在家長區設定的推薦關卡，選關畫面會標「爸媽推薦」', async () => {
    useSettingsStore.setState((s) => ({ recommendedLevels: { ...s.recommendedLevels, memory: 'hard' } }))
    renderAt('/memory')
    const picker = await screen.findByRole('navigation', { name: '選關卡' }, { timeout: 5000 })
    const hard = within(picker).getByRole('link', { name: /^挑戰/ })
    expect(within(hard).getByText('爸媽推薦')).toBeTruthy()
    expect(within(within(picker).getByRole('link', { name: /^簡單/ })).queryByText('爸媽推薦')).toBeNull()
  })
})
