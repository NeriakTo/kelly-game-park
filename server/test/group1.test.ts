import { expect, test } from 'vitest'
import { fixture, math } from './helpers.js'
test('通行碼缺少、錯誤、正確及停用', async () => {
 const f = fixture()
 for (const value of ['', 'bad']) expect((await f.request(undefined, math, { 'x-family-passcode': value })).status).toBe(401)
 expect((await f.request()).status).toBe(200)
 expect((await fixture({ passcodeHash: '' }).request()).status).toBe(503)
 expect((await fixture({ apiKey: '' }).request()).status).toBe(503)
 expect((await fixture({ apiKey: '' }).request('/api/ai/status')).json.enabled).toBe(false)
})
test('錯十次鎖十五分鐘，十分鐘視窗會過期', async () => {
 let now = 0; const f = fixture({ deps: { now: () => now } })
 for (let i = 0; i < 10; i++) expect((await f.request(undefined, math, { 'x-family-passcode': 'bad' })).status).toBe(401)
 expect((await f.request()).json.error).toBe('locked')
 now += 15 * 60000; expect((await f.request()).status).toBe(200)
 const g = fixture({ deps: { now: () => now } })
 for (let i = 0; i < 9; i++) await g.request(undefined, math, { 'x-family-passcode': 'bad' })
 now += 10 * 60000 + 1; await g.request(undefined, math, { 'x-family-passcode': 'bad' })
 expect((await g.request()).status).toBe(200)
})
