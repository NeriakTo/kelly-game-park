import { describe, it, expect } from 'vitest'
import { isParentUnlocked, lockParent, makeGateQuestion, unlockParent, PARENT_UNLOCK_MS } from './parentGate'

describe('家長區的門（純函式）', () => {
  it('出的題目一定是兩位數乘兩位數，且不出整十數', () => {
    for (let i = 0; i < 500; i++) {
      const q = makeGateQuestion()
      for (const n of [q.a, q.b]) {
        expect(n).toBeGreaterThanOrEqual(12)
        expect(n).toBeLessThanOrEqual(99)
        expect(n % 10).not.toBe(0)
      }
      expect(q.answer).toBe(q.a * q.b)
    }
  })

  it('開門後 10 分鐘內算開著，剛好滿 10 分鐘就關上；鎖上後立刻關上', () => {
    const t = 1_000_000
    expect(isParentUnlocked(t)).toBe(false)
    unlockParent(t)
    expect(isParentUnlocked(t + PARENT_UNLOCK_MS - 1)).toBe(true)
    expect(isParentUnlocked(t + PARENT_UNLOCK_MS)).toBe(false)
    lockParent()
    expect(isParentUnlocked(t + 1)).toBe(false)
  })
})
