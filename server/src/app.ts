import type { IncomingMessage, ServerResponse } from 'node:http'
import { ClaudeModel, type Model, type ModelConfig } from './model.js'
import { mathRequest, shopRequest, normalize, type Kind } from './schemas.js'
import { Usage } from './usage.js'
import { Guard, validPasscode } from './guard.js'
import { security, safePath, staticFile } from './static.js'
export interface Config extends ModelConfig { passcodeHash?: string; dataDir: string; staticDir: string; dailyLimit: number }
interface Request { path: string; method: string; headers: Record<string, string | undefined>; body: string | Buffer; remoteAddress?: string; oversized?: boolean }
interface Response { status: number; headers: Record<string, string>; body: string | Buffer; json?: any }
interface Deps { now?: () => number; log?: (line: string) => void; model?: Model }
const json = (status: number, data: unknown): Response => ({ status, headers: { ...security, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify(data), json: data })
const error = (status: number, code: string) => json(status, { error: code })
export function createApp(config: Config, deps: Deps = {}) {
  const now = deps.now ?? Date.now; const log = deps.log ?? console.log
  const usage = new Usage(config.dataDir, now, config.dailyLimit); const guard = new Guard(now)
  const configured = /^[a-fA-F0-9]{64}$/.test(config.passcodeHash ?? '')
  const enabled = configured && Boolean(config.apiKey)
  const model = deps.model ?? (enabled ? new ClaudeModel(config) : undefined)
  let active = 0
  async function dispatch(req: Request, tokens: { input: number; output: number }): Promise<Response> {
    let path: string
    try { path = decodeURIComponent(req.path.split('?')[0]) } catch { return error(400, 'bad_request') }
    if (!safePath(path)) return error(400, 'bad_request')
    if (path === '/healthz') return req.method === 'GET' ? json(200, { ok: true }) : error(405, 'method_not_allowed')
    if (!path.startsWith('/api/') && path !== '/api') {
      if (!['GET', 'HEAD'].includes(req.method)) return error(405, 'method_not_allowed')
      try { return staticFile(config.staticDir, path) } catch { return error(404, 'not_found') }
    }
    const status = path === '/api/ai/status'
    const kind: Kind | undefined = path === '/api/ai/math' ? 'math' : path === '/api/ai/shop' ? 'shop' : undefined
    if (!status && !kind) return error(404, 'not_found')
    if (req.method !== (status ? 'GET' : 'POST')) return error(405, 'method_not_allowed')
    if (req.oversized || Buffer.byteLength(req.body) > 4096) return error(413, 'too_large')
    const source = req.headers['cf-connecting-ip'] || req.remoteAddress || 'unknown'
    if (guard.locked(source)) return error(429, 'locked')
    if (!configured || (!status && !enabled)) return error(503, 'disabled')
    if (!validPasscode(req.headers['x-family-passcode'] ?? '', config.passcodeHash!)) { guard.fail(source); return error(401, 'passcode') }
    if (guard.limited(source)) return error(429, 'rate_limited')
    if (status) return json(200, { enabled, remainingToday: usage.remaining(), dailyLimit: config.dailyLimit })
    let input: Record<string, unknown>
    try { input = (kind === 'math' ? mathRequest : shopRequest).parse(JSON.parse(req.body.toString())) } catch { return error(400, 'bad_request') }
    if (usage.remaining() === 0) return error(429, 'daily_limit')
    if (active >= 4) return error(429, 'busy')
    // Synchronous reservation prevents concurrent requests from overspending the limit.
    try { usage.consume() } catch { return error(503, 'disabled') }
    active++
    try {
      const result = await model!.generate(kind!, input)
      tokens.input = result.usage?.input_tokens ?? 0; tokens.output = result.usage?.output_tokens ?? 0
      if (result.stop_reason === 'refusal' || result.stop_reason === 'max_tokens' || result.parsed_output == null) return error(502, 'upstream')
      return json(200, normalize(kind!, result.parsed_output, input))
    } catch (e) {
      if (e instanceof Error && ['APIConnectionTimeoutError', 'TimeoutError', 'AbortError'].includes(e.name)) return error(504, 'timeout')
      return error(502, 'upstream')
    } finally { active-- }
  }
  async function inject(req: Request): Promise<Response> {
    const started = now(); const tokens = { input: 0, output: 0 }
    const res = await dispatch(req, tokens)
    // Log only a fixed route label; untrusted URL query/path may contain secrets.
    if (req.path.startsWith('/api')) {
      const path = req.path.split('?')[0]
      log(JSON.stringify({ time: new Date(now()).toISOString(), path: ['/api/ai/math', '/api/ai/shop', '/api/ai/status'].includes(path) ? path : '/api/unknown', status: res.status, durationMs: Math.max(0, now() - started), inputTokens: tokens.input, outputTokens: tokens.output, remainingToday: usage.remaining() }))
    }
    return res
  }
  async function handler(req: IncomingMessage, res: ServerResponse) {
    let size = 0; const chunks: Buffer[] = []; let completed = false
    const send = async (oversized = false) => {
      if (completed) return; completed = true
      const headers: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(req.headers)) headers[key] = Array.isArray(value) ? value.join(',') : value
      const result = await inject({ path: req.url ?? '/', method: req.method ?? 'GET', headers, body: Buffer.concat(chunks), remoteAddress: req.socket.remoteAddress, oversized })
      res.writeHead(result.status, result.headers); res.end(req.method === 'HEAD' ? undefined : result.body)
    }
    req.on('data', (chunk: Buffer) => {
      if (completed) return
      size += chunk.length
      if (size > 4096) { void send(true); req.resume() } else chunks.push(chunk)
    })
    req.on('end', () => { void send() })
    req.on('error', () => { if (!completed) { completed = true; res.writeHead(400, { ...security, 'content-type': 'application/json' }); res.end('{"error":"bad_request"}') } })
  }
  return { inject, handler }
}
