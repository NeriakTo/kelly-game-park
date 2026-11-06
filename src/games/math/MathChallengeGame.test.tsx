import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import MathChallengeGame from './MathChallengeGame'
import { GRADE_UNITS, type Grade } from './generators'
import { useGameStore } from '../../stores/gameStore'

// 題目上方那行「…｜課綱：N-2-2｜來源：…」顯示的是目前這題的課綱標籤，
// 每個單元的標籤不同，用它判斷畫面上的題目屬於哪個年級、哪個單元。
function shownCurriculumTag(): string {
  const meta = screen.getByText(/｜課綱：/)
  return meta.textContent?.match(/課綱：([A-Z]-\d-\d+)/)?.[1] ?? ''
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
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('切年級後立即換成新年級第一個單元的題目', () => {
    render(<MathChallengeGame />)
    expect(shownCurriculumTag()).toBe(firstUnitTag(2))

    for (const g of [5, 3, 1, 6, 4] as Grade[]) {
      fireEvent.click(screen.getByRole('button', { name: `${g} 年級` }))
      expect(shownCurriculumTag()).toBe(firstUnitTag(g))
      expect(optionButtons()).toHaveLength(4)
    }
  })

  it('答題後立刻切年級，原本排定的下一題不會蓋掉新年級的題目', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    render(<MathChallengeGame />)

    fireEvent.click(optionButtons()[0])
    fireEvent.click(screen.getByRole('button', { name: '5 年級' }))
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(shownCurriculumTag()).toBe(firstUnitTag(5))
    expect(shownQuestionNo()).toBe('題號：1/10')
  })
})
