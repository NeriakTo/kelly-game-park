import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import MathChallengeGame from './MathChallengeGame'
import { GRADE_UNITS, type Grade } from './generators'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'

// 每個單元的課綱標籤不同，用它判斷畫面上的題目屬於哪個年級、哪個單元。
// 改版後課綱代碼不再顯示給小孩看（移到家長區），題目卡片只在 data-curriculum-tag 屬性留著給測試讀。
function shownCurriculumTag(): string {
  return screen.getByTestId('math-problem').getAttribute('data-curriculum-tag') ?? ''
}

// 改版後年級由家長區設定（數學畫面上的年級按鈕拿掉了），這裡直接改設定裡的年級
function switchGrade(g: Grade) {
  act(() => {
    useSettingsStore.getState().setGrade(g)
  })
}

function shownQuestionNo(): string {
  return screen.getByText(/題號：/).textContent ?? ''
}

function optionButtons(): HTMLElement[] {
  return screen
    .getAllByRole('button')
    .filter((b) => /^\d+(\.\d+)?$/.test(b.textContent?.trim() ?? ''))
}

function firstUnitTag(g: Grade): string {
  return GRADE_UNITS[g][0].curriculumTag
}

describe('數學挑戰：切換年級', () => {
  beforeEach(() => {
    // 固定用本地題庫、沒有 AI 金鑰，確保測試不會連外
    useGameStore.setState((s) => ({ aiConfig: null, aiModes: { ...s.aiModes, math: 'local' } }))
    // 家長區預設是 3 年級；這兩條測試沿用改版前數學頁的起始年級（2 年級）
    useSettingsStore.setState({ grade: 2 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('切年級後立即換成新年級第一個單元的題目', () => {
    render(<MathChallengeGame />)
    expect(shownCurriculumTag()).toBe(firstUnitTag(2))

    for (const g of [5, 3, 1, 6, 4] as Grade[]) {
      switchGrade(g)
      expect(shownCurriculumTag()).toBe(firstUnitTag(g))
      expect(optionButtons()).toHaveLength(4)
    }
  })

  it('答題後立刻切年級，原本排定的下一題不會蓋掉新年級的題目', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    render(<MathChallengeGame />)

    fireEvent.click(optionButtons()[0])
    switchGrade(5)
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(shownCurriculumTag()).toBe(firstUnitTag(5))
    expect(shownQuestionNo()).toBe('題號：1/10')
  })
})
