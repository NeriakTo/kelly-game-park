import { expect, test } from 'vitest'
import { fixture, good } from './helpers.js'
const shop = { stage: 'B', difficulty: 2 }
const output = { description: '商店', answer: 9, hint: '先算總價', options: [1, 2, 3, 4, 5, 6] }
const model = (data = output) => ({ generate: async () => ({ ...good, parsed_output: data }) })
test('Fisher–Yates 使用注入序列，補答案截到六個後打亂', async () => {
 const sequence = [0, 1, 0, 1, 0]; const bounds: number[] = []
 const f = fixture({ deps: { model: model(), randomInt: (max: number) => { bounds.push(max); return sequence.shift()! } } })
 const r = await f.request('/api/ai/shop', shop)
 expect(r.status).toBe(200)
 expect(bounds).toEqual([6, 5, 4, 3, 2])
 expect(r.json.options).toEqual([2, 3, 4, 5, 1, 9])
 expect(r.json.options.indexOf(r.json.answer)).not.toBe(0)
})
test('預設亂數六十次至少三種答案位置且選項完整不重複', async () => {
 const f = fixture({ deps: { model: model() } }); const positions = new Set<number>()
 for (let i = 0; i < 60; i++) {
  const r = await f.request('/api/ai/shop', shop, { 'cf-connecting-ip': `sample-${i}` })
  expect(r.status).toBe(200)
  const options: number[] = r.json.options
  expect(options).toContain(r.json.answer)
  expect(options.length).toBeGreaterThanOrEqual(2); expect(options.length).toBeLessThanOrEqual(6)
  expect(new Set(options).size).toBe(options.length)
  positions.add(options.indexOf(r.json.answer))
 }
 expect(positions.size).toBeGreaterThanOrEqual(3)
})
test('打亂前去除重複選項並保留答案', async () => {
 const f = fixture({ deps: { model: model({ ...output, options: [1, 1, 2] }), randomInt: () => 0 } })
 const r = await f.request('/api/ai/shop', shop)
 expect(r.status).toBe(200)
 expect(r.json.options).toEqual([1, 2, 9])
})
