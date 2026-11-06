import { expect, test } from 'vitest'
import { readFileSync, writeFileSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fixture, math, good } from './helpers.js'
import { createApp } from '../src/app.js'
test('路徑與方法優先於大小；status 不呼叫模型', async () => {
 const f = fixture()
 expect((await f.request('/api/nope', 'a'.repeat(5000))).status).toBe(404)
 expect((await f.request('/api/ai/math', 'a'.repeat(5000), {}, 'GET')).status).toBe(405)
 expect((await f.request('/api/ai/status')).status).toBe(200)
 expect(f.calls).toHaveLength(0)
 expect((await f.request('/healthz', {}, {}, 'POST')).status).toBe(405)
})
test('欄位界線、錯誤型別與缺漏', async () => {
 const invalid = [{ ...math, unitId: '../x' }, { ...math, curriculumTag: '中文' }, { ...math, weakPoints: Array(6).fill('進位') }, { ...math, unitDescription: 'x'.repeat(61) }, { ...math, difficulty: 1.5 }, null, []]
 for (const body of invalid) expect((await fixture().request(undefined, body)).status).toBe(400)
 const f = fixture()
 expect((await f.request(undefined, { ...math, difficulty: 1, weakPoints: [], unitDescription: '' })).status).toBe(200)
})
test('非數字、超界答案、空提示與錯誤選項拒收', async () => {
 for (const output of [{ ...good.parsed_output, answer: 1e9 + 1 }, { ...good.parsed_output, answer: '6' }, { ...good.parsed_output, hint: '  ' }]) {
  const f = fixture({ deps: { model: { generate: async () => ({ ...good, parsed_output: output }) } } }); expect((await f.request()).status).toBe(502)
 }
 for (const options of [[-1, 2], [1, 1], [1], [1, 2, 3, 4, 5, 6, 7]]) {
  const f = fixture({ deps: { model: { generate: async () => ({ ...good, parsed_output: { description: '商店', hint: '提示', answer: 1, options } }) } } }); expect((await f.request('/api/ai/shop', { stage: 'A', difficulty: 1 })).status).toBe(502)
 }
})
test('商店選項去重；未提供選項合法', async () => {
 for (const options of [undefined, [1, 1, 2]]) {
  const f = fixture({ deps: { model: { generate: async () => ({ ...good, parsed_output: { description: '商店', hint: '提示', answer: 1, options } }) } } })
  const r = await f.request('/api/ai/shop', { stage: 'C', difficulty: 5 })
  expect(r.status).toBe(200); if (options) expect(r.json.options).toEqual([1, 2])
 }
})
test('資料檔損壞不靜默歸零；每次呼叫確實寫入', async () => {
 const f = fixture(); await f.request()
 expect(JSON.parse(readFileSync(join(f.dir, 'usage.json'), 'utf8')).count).toBe(1)
 writeFileSync(join(f.dir, 'usage.json'), '{broken')
 expect(() => createApp(f.config)).toThrow()
})
test('靜態檔符號連結不得逃出根目錄', async () => {
 const f = fixture(); writeFileSync(join(f.dir, 'private.txt'), 'private')
 symlinkSync(join(f.dir, 'private.txt'), join(f.config.staticDir, 'escape.txt'))
 const r = await f.request('/escape.txt'); expect(r.status).toBe(404); expect(r.body.toString()).not.toContain('private')
})
test('未知 API 紀錄不回顯 URL；查詢字串不回顯', async () => {
 const f = fixture(); await f.request('/api/private-secret'); await f.request('/api/ai/status?secret=query-secret')
 expect(f.logs).toHaveLength(2); expect(f.logs.join('')).not.toMatch(/private-secret|query-secret/)
})
