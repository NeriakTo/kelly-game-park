import { expect, test } from 'vitest'
import { APIConnectionTimeoutError } from '@anthropic-ai/sdk'
import { fixture, math, good } from './helpers.js'
test('數學欄位與字串清理；商店答案補入且保留', async () => {
 expect((await fixture().request()).json).toEqual({ text: '題目', answer: 6, hint: '提示', unitId: math.unitId, curriculumTag: math.curriculumTag })
 const f = fixture({ deps: { model: { generate: async () => ({ ...good, parsed_output: { description: ' 商店 ', answer: 9, hint: ' 提示 ', options: [1, 2, 3, 4, 5, 6] } }) } } })
 const res = await f.request('/api/ai/shop', { stage: 'B', difficulty: 2 }); expect(res.status).toBe(200); expect(res.json.options).toContain(9); expect(res.json.options.length).toBeLessThanOrEqual(6)
})
test('拒答、截斷、空輸出與不合格輸出回 502', async () => {
 for (const result of [{ ...good, stop_reason: 'refusal' }, { ...good, stop_reason: 'max_tokens' }, { ...good, parsed_output: null }, { ...good, parsed_output: { ...good.parsed_output, answer: Infinity } }, { ...good, parsed_output: { ...good.parsed_output, text: 'a'.repeat(301) } }]) expect((await fixture({ deps: { model: { generate: async () => result } } }).request()).status).toBe(502)
})
test('逾時與錯誤不洩漏', async () => {
 const f = fixture({ deps: { model: { generate: async () => { throw new Error('upstream-private-secret') } } } })
 const res = await f.request(); expect(res.status).toBe(502); expect(JSON.stringify(res.json)).not.toContain('upstream-private-secret')
 const g = fixture({ deps: { model: { generate: async () => { throw new APIConnectionTimeoutError() } } } }); expect(await g.request()).toMatchObject({ status: 504, json: { error: 'timeout' } })
})

test('只有 SDK 逾時類別回 504，同名的一般錯誤仍回 502', async () => {
 const f = fixture({ deps: { model: { generate: async () => { const e = new Error('private'); e.name = 'APIConnectionTimeoutError'; throw e } } } })
 expect(await f.request()).toMatchObject({ status: 502, json: { error: 'upstream' } })
})
