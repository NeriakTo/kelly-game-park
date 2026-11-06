import { describe, it, expect } from 'vitest'
import { GRADE_UNITS, generateProblem, buildOptions } from './generators'

// 出題是隨機的，每個單元多跑幾次，盡量涵蓋各種題型與簡單模式
const RUNS = 200

// 只算「數字 運算子 數字 … = ?」這種純算式，先乘除後加減
function evaluate(expr: string): number {
  const tokens = expr.trim().split(/\s+/)
  const terms: number[] = [Number(tokens[0])]
  const addOps: string[] = []
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]
    const n = Number(tokens[i + 1])
    const last = terms.length - 1
    if (op === '×') terms[last] *= n
    else if (op === '÷') terms[last] /= n
    else {
      addOps.push(op)
      terms.push(n)
    }
  }
  return terms.reduce((acc, t, i) => (i === 0 ? t : addOps[i - 1] === '+' ? acc + t : acc - t), 0)
}

const PURE_EXPRESSION = /^([\d.]+(?: [+\-×÷] [\d.]+)+) = \?/

describe('數學出題器：三年級各單元', () => {
  for (const unit of GRADE_UNITS[3]) {
    describe(`${unit.name}（${unit.id}）`, () => {
      it('題目屬於該單元，答案是有限的非負數', () => {
        for (let i = 0; i < RUNS; i++) {
          const p = generateProblem(unit.id, i % 2 === 0)
          expect(p.unitId).toBe(unit.id)
          expect(p.curriculumTag).toBe(unit.curriculumTag)
          expect(p.text.length).toBeGreaterThan(0)
          expect(Number.isFinite(p.answer)).toBe(true)
          expect(p.answer).toBeGreaterThanOrEqual(0)
        }
      })

      it('四個選項互不相同、都不是負數，而且恰好一個是正確答案', () => {
        for (let i = 0; i < RUNS; i++) {
          const p = generateProblem(unit.id, i % 2 === 0)
          const options = buildOptions(p.answer, 3)
          expect(options).toHaveLength(4)
          expect(new Set(options).size).toBe(4)
          const correct = options.filter((o) => Math.abs(o - p.answer) < 1e-4)
          expect(correct).toHaveLength(1)
          for (const o of options) expect(o).toBeGreaterThanOrEqual(0)
        }
      })
    })
  }

  it('純算式題（例如 23 × 4 = ?、0.3 + 0.5 = ?）的答案等於算式結果', () => {
    let checked = 0
    for (const unit of GRADE_UNITS[3]) {
      for (let i = 0; i < RUNS; i++) {
        const p = generateProblem(unit.id, i % 2 === 0)
        if (p.text.includes('...')) continue // 有餘數的除法題問的是商，不是算式結果
        const m = p.text.match(PURE_EXPRESSION)
        if (!m) continue
        checked += 1
        expect(Math.abs(evaluate(m[1]) - p.answer), p.text).toBeLessThan(1e-6)
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})
