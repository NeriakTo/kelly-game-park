import { expect, test } from 'vitest'
import { fixture, math, good } from './helpers.js'
// 答案已經以獨立數字出現在題目裡，等於照抄題目，孩子不用算；退回讓前端改用本機題目。
const cases = [
 { label: '照抄題目的份數', answer: 3, text: '切成 8 份，小美吃了其中 3 份，她吃了幾份？', status: 502 },
 { label: '問分母', answer: 8, text: '平均分成 8 塊，請問分母是多少？', status: 502 },
 { label: '題目已給經過時間', answer: 35, text: '坐了 35 分鐘到學校，經過了幾分鐘？', status: 502 },
 { label: '答案沒出現在題目', answer: 45, text: '8 點 20 分出門，9 點 5 分到校，經過幾分鐘？', status: 200 },
 { label: '題目有較長的數字不算', answer: 24, text: '有 124 張貼紙，用掉 100 張，還剩幾張？', status: 200 },
]
for (const kind of ['math', 'shop'] as const) {
 test.each(cases)(`${kind}：$label`, async ({ answer, text, status }) => {
  const parsed_output = { [kind === 'math' ? 'text' : 'description']: text, answer, hint: '先想想要用什麼方法。' }
  const f = fixture({ deps: { model: { generate: async () => ({ ...good, parsed_output }) } } })
  const r = await f.request(`/api/ai/${kind}`, kind === 'math' ? math : { stage: 'B', difficulty: 2 })
  expect(r.status).toBe(status)
  if (status === 502) expect(r.json).toEqual({ error: 'upstream' })
 })
}
