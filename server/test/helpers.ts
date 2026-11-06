import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach } from 'vitest'
import { createApp } from '../src/app.js'
export const pass = 'family-test-pass'
export const hash = createHash('sha256').update(pass).digest('hex')
export const math = { gradeBand: 'grade-3', unitId: 'g3-multiply', unitName: '乘法', unitDescription: '二位數乘一位數', curriculumTag: 'N-3-3', difficulty: 3 }
export const good = { stop_reason: 'end_turn', parsed_output: { text: ' 題目 ', answer: 6, hint: ' 提示 ', unitId: 'wrong', curriculumTag: 'wrong' }, usage: { input_tokens: 12, output_tokens: 8 } }
const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
export function fixture(extra: Record<string, any> = {}) {
 const dir = mkdtempSync(join(tmpdir(), 'kelly-')); dirs.push(dir)
 mkdirSync(join(dir, 'web/assets'), { recursive: true }); writeFileSync(join(dir, 'web/index.html'), '<html>公園</html>'); writeFileSync(join(dir, 'web/assets/x.js'), 'export {}')
 const logs: string[] = []; const calls: any[] = []
 const config = { passcodeHash: hash, apiKey: 'fake-secret-key', dataDir: dir, staticDir: join(dir, 'web'), dailyLimit: 300, ...extra }
 const app = createApp(config, { now: () => Date.now(), log: (s: string) => logs.push(s), model: { generate: async (...args: any[]) => { calls.push(args); return good } }, ...extra.deps })
 const request = (path = '/api/ai/math', body: any = math, headers: Record<string, string> = {}, method = ['/api/ai/math', '/api/ai/shop'].includes(path) ? 'POST' : 'GET') => app.inject({ path, method, headers: { 'x-family-passcode': pass, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
 return { app, request, logs, calls, config, dir }
}
