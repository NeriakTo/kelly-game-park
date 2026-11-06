// Local-only smoke check; launches and terminates only the child it owns.
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { once } from 'node:events'
const root = resolve(import.meta.dirname, '../..')
const data = await mkdtemp(join(tmpdir(), 'kelly-smoke-'))
const pass = 'smoke-only-fake-pass'
const env = { ...process.env, PORT: '0', DATA_DIR: data, STATIC_DIR: join(root, 'dist'), FAMILY_PASSCODE_SHA256: createHash('sha256').update(pass).digest('hex') }
delete env.ANTHROPIC_API_KEY
console.log('COMMAND: node server/test/smoke.mjs')
console.log('啟動：node server/dist/index.js；PORT=0；STATIC_DIR=dist；臨時 DATA_DIR；假通行碼雜湊；移除金鑰')
const child = spawn(process.execPath, ['server/dist/index.js'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] })
child.stderr.on('data', data => process.stderr.write(data))
let exitPromise = once(child, 'exit')
try {
 const port = await new Promise((resolvePort, reject) => {
  let buffer = ''
  const timer = setTimeout(() => reject(new Error('啟動逾時')), 5000)
  child.once('exit', () => { clearTimeout(timer); reject(new Error('啟動提前退出')) })
  child.stdout.on('data', data => {
   buffer += data.toString()
   for (const line of buffer.split('\n')) {
    try { const row = JSON.parse(line); if (row.event === 'listening') { clearTimeout(timer); resolvePort(row.port); return } } catch {}
   }
  })
 })
 const checks = [
  ['/healthz', { method: 'GET' }, 200, body => JSON.parse(body).ok === true],
  ['/', { method: 'GET' }, 200, body => /<!doctype html>/i.test(body)],
  ['/api/ai/status', { headers: { 'X-Family-Passcode': pass } }, 200, body => JSON.parse(body).enabled === false],
  ['/api/ai/math', { method: 'POST', headers: { 'X-Family-Passcode': pass, 'Content-Type': 'application/json' }, body: '{}' }, 503, body => JSON.parse(body).error === 'disabled'],
  ['/api/ai/math', { method: 'POST', headers: { 'X-Family-Passcode': pass }, body: 'x'.repeat(4097) }, 413, body => JSON.parse(body).error === 'too_large'],
 ]
 for (const [path, init, expected, check] of checks) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { ...init, signal: AbortSignal.timeout(5000) })
  const body = await res.text()
  const ok = res.status === expected && check(body)
  console.log(`${init.method ?? 'GET'} ${path}: HTTP ${res.status}; ${ok ? 'PASS' : 'FAIL'}${path === '/' ? '; text/html' : '; ' + body}`)
  if (!ok) throw new Error('冒煙檢查失敗')
 }
 console.log('通過 5，失敗 0；連線僅本機 loopback，未連模型。')
} finally {
 if (child.exitCode === null) { console.log(`停止自己啟動的 PID ${child.pid}`); child.kill('SIGTERM') }
 await exitPromise
 await rm(data, { recursive: true, force: true })
}
