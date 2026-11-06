import { expect, test } from 'vitest'
import { fixture } from './helpers.js'
test('靜態檔、快取、SPA 與安全標頭', async () => {
 const f = fixture()
 for (const path of ['/', '/missing']) { const r = await f.request(path); expect(r.status).toBe(200); expect(r.body.toString()).toContain('<html>'); expect(r.headers['cache-control']).toBe('no-store') }
 const js = await f.request('/assets/x.js'); expect(js.headers['content-type']).toContain('javascript'); expect(js.headers['cache-control']).toContain('immutable')
 for (const [key, value] of Object.entries({ 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY' })) expect(js.headers[key]).toBe(value)
})
test('原始與編碼路徑穿越皆擋，API 與方法正確', async () => {
 const f = fixture()
 for (const path of ['/../server/package.json', '/%2e%2e/server/package.json', '/%2e%2e%2fserver/package.json', '/..%5cserver/package.json']) expect((await f.request(path)).status).toBe(400)
 expect((await f.request('/api/nope')).json).toEqual({ error: 'not_found' }); expect((await f.request('/api/ai/math', {}, {}, 'GET')).status).toBe(405); expect((await f.request('/healthz')).json).toEqual({ ok: true })
})
