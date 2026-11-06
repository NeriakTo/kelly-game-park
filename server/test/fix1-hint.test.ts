import { expect, test } from 'vitest'
import { fixture, math, good } from './helpers.js'
import { ClaudeModel } from '../src/model.js'
const cases = [
 { label: '提示直接洩漏答案', answer: 92, text: '一共多少？', hint: '所以是 92', status: 502 },
 { label: '題目已有同一獨立數字（照抄題目，第 3 輪改為退回）', answer: 1, text: '先取 1 份，再想想。', hint: '先想這 1 份', status: 502 },
 { label: '較長整數不誤擋', answer: 24, text: '一共多少？', hint: '先看 124', status: 200 },
 { label: '小數答案洩漏', answer: 2.5, text: '一共多少？', hint: '結果是 2.5', status: 502 },
 { label: '小數內的整數不誤擋', answer: 24, text: '一共多少？', hint: '先想 24.5 和 1.24', status: 200 },
 { label: '題目較長整數不能豁免洩漏', answer: 24, text: '有 124 個，還剩多少？', hint: '所以是 24', status: 502 },
]
for (const kind of ['math', 'shop'] as const) {
 test.each(cases)(`${kind}：$label`, async ({ answer, text, hint, status }) => {
  const parsed_output = { [kind === 'math' ? 'text' : 'description']: text, answer, hint }
  const f = fixture({ deps: { model: { generate: async () => ({ ...good, parsed_output }) } } })
  const r = await f.request(`/api/ai/${kind}`, kind === 'math' ? math : { stage: 'B', difficulty: 2 })
  expect(r.status).toBe(status)
  if (status === 502) expect(r.json).toEqual({ error: 'upstream' })
  else expect(r.json).toMatchObject(parsed_output)
 })
}
test('兩種題型的系統提示限制答案洩漏並要求自然單一數字問題', async () => {
 const captured: any[] = []
 const model = new ClaudeModel({ apiKey: 'fake' }, { messages: { parse: async (params: any) => { captured.push(params); return {} } } } as any)
 for (const kind of ['math', 'shop'] as const) await model.generate(kind, {})
 for (const { system } of captured) {
  for (const rule of ['提示只引導想法', '不得寫出最後答案', '不得寫出最後一步算出的結果', '自然地用一個數字回答', '分成幾份', '吃了幾份', '不要要求孩子「只填某一部分」']) expect(system).toContain(rule)
 }
})
