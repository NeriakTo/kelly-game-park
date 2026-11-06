import { expect, test } from 'vitest'
import { fixture, math } from './helpers.js'
test('嚴格驗證數學與商店欄位', async () => {
 const f = fixture()
 for (const body of [{ ...math, extra: 1 }, { ...math, difficulty: '3' }, { ...math, unitName: '長'.repeat(21) }, { ...math, difficulty: 6 }, { ...math, gradeBand: 'grade-7' }, { ...math, weakPoints: ['a'.repeat(31)] }, '{']) expect((await f.request(undefined, body)).status).toBe(400)
 for (const body of [{ stage: 'D', difficulty: 2 }, { stage: 'B', difficulty: 2, extra: 1 }]) expect((await f.request('/api/ai/shop', body)).status).toBe(400)
})
test('本文四 KB 限制先於通行碼檢查', async () => {
 expect((await fixture().request(undefined, '中'.repeat(1400), { 'x-family-passcode': '' })).status).toBe(413)
})
