import { expect, test } from 'vitest'
import { fixture, math, good, pass } from './helpers.js'
import { createApp } from '../src/app.js'
test('每分鐘第二十一次拒絕，來源隔離', async () => {
 let now = 0; const f = fixture({ deps: { now: () => now } })
 for (let i = 0; i < 20; i++) expect((await f.request()).status).toBe(200)
 expect((await f.request()).json.error).toBe('rate_limited')
 expect((await f.request(undefined, math, { 'cf-connecting-ip': 'other' })).status).toBe(200)
 now += 60000; expect((await f.request()).status).toBe(200)
})
test('每日計數落地、新實例延續、台北跨日歸零', async () => {
 let now = Date.parse('2026-11-06T15:59:59Z'); const f = fixture({ dailyLimit: 1, deps: { now: () => now } })
 expect((await f.request(undefined, { ...math, difficulty: 6 })).status).toBe(400)
 expect((await f.request()).status).toBe(200)
 const app = createApp(f.config, { now: () => now, log: () => {}, model: { generate: async () => good } })
 const req = () => app.inject({ path: '/api/ai/math', method: 'POST', headers: { 'x-family-passcode': pass }, body: JSON.stringify(math) })
 expect((await req()).json.error).toBe('daily_limit'); now += 1000; expect((await req()).status).toBe(200)
})
test('上游失敗也計次；四個同時呼叫後 busy 不計次', async () => {
 const bad = fixture({ dailyLimit: 1, deps: { model: { generate: async () => { throw Error('oops') } } } })
 expect((await bad.request()).status).toBe(502); expect((await bad.request()).json.error).toBe('daily_limit')
 let release!: (v: any) => void; const pending = new Promise(r => { release = r })
 const f = fixture({ deps: { model: { generate: () => pending } } })
 const requests = Array.from({ length: 4 }, () => f.request()); await new Promise(r => setTimeout(r, 10))
 expect((await f.request()).json.error).toBe('busy'); release(good); await Promise.all(requests)
 expect((await f.request('/api/ai/status')).json.remainingToday).toBe(296)
})
