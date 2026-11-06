import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { GameSessionContext, type GameSession } from '../../components/GameShell/session'
import type { Level } from '../../data/levels'
import type { Problem } from './generators'

// 數學的三段：簡單＝一律出簡單題；普通＝連錯 2 題自動改出簡單題（原本的做法）；挑戰＝一律正常題。
// 用假的出題器記下每次出題有沒有要「簡單題」（第二個參數），並拿它的回傳值知道正確答案。

const calls = vi.hoisted(() => ({ easyFlags: [] as boolean[], problems: [] as Problem[] }))

vi.mock('./generators', async (importOriginal) => {
  const real = await importOriginal<typeof import('./generators')>()
  return {
    ...real,
    generateProblem: (unitId: string, easy = false) => {
      const p = real.generateProblem(unitId, easy)
      calls.easyFlags.push(easy)
      calls.problems.push(p)
      return p
    },
  }
})

const { default: MathChallengeGame } = await import('./MathChallengeGame')

function inSession(level: Level, children: ReactNode) {
  const session: GameSession = { game: 'math', level, reportResult: () => {} }
  return <GameSessionContext.Provider value={session}>{children}</GameSessionContext.Provider>
}

function currentAnswer(): number {
  const tag = screen.getByTestId('math-problem')
  const text = tag.querySelector('[data-problem-text]')?.textContent
  const shown = [...calls.problems].reverse().find((p) => p.text === text)
  if (!shown) throw new Error(`找不到畫面上的題目：${text}`)
  return shown.answer
}

function answerWrong() {
  const answer = currentAnswer()
  const wrong = screen
    .getAllByRole('button')
    .find((b) => /^\d+(\.\d+)?$/.test(b.textContent?.trim() ?? '') && Number(b.textContent) !== answer)
  if (!wrong) throw new Error('找不到錯的選項')
  fireEvent.click(wrong)
  act(() => {
    vi.advanceTimersByTime(3000)
  })
}

describe('數學挑戰的三段', () => {
  beforeEach(() => {
    calls.easyFlags = []
    calls.problems = []
    useGameStore.setState((s) => ({ aiConfig: null, aiModes: { ...s.aiModes, math: 'local' } }))
    useSettingsStore.setState({ grade: 3 })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('簡單：每一題都是簡單題', () => {
    render(inSession('easy', <MathChallengeGame />))
    answerWrong()
    answerWrong()
    expect(calls.easyFlags.length).toBeGreaterThan(0)
    expect(calls.easyFlags.every(Boolean)).toBe(true)
  })

  it('普通：一開始是正常題，連錯 2 題後改出簡單題', () => {
    render(inSession('normal', <MathChallengeGame />))
    expect(calls.easyFlags[0]).toBe(false)
    answerWrong()
    answerWrong()
    expect(calls.easyFlags).toContain(true)
  })

  it('挑戰：連錯也不會變簡單', () => {
    render(inSession('hard', <MathChallengeGame />))
    answerWrong()
    answerWrong()
    answerWrong()
    expect(calls.easyFlags.length).toBeGreaterThan(0)
    expect(calls.easyFlags.some(Boolean)).toBe(false)
  })
})
