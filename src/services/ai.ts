import type { AIConfig } from '../types'

// AI 出題：呼叫網站自己的伺服器（伺服器再呼叫 Claude，金鑰只放伺服器）。
// 合約見 docs/ai-workflow/kelly-ai/00-task-spec.md 第三節：只送合約上的欄位、超過長度先截斷，
// 帶標頭 X-Family-Passcode。任何非 200、逾時、網路錯誤、回傳格式不對，一律安靜改用本機題目，
// 孩子畫面不顯示錯誤或來源（失敗原因只寫進主控台紀錄，給大人查）。

export const AI_CLIENT_TIMEOUT_MS = 8000

/** 家用通行碼：只收英數字與 -，8～64 字（要放進 HTTP 標頭） */
export const PASSCODE_PATTERN = /^[A-Za-z0-9-]{8,64}$/

export function isValidPasscode(value: string | null | undefined): value is string {
  return typeof value === 'string' && PASSCODE_PATTERN.test(value)
}

export interface AIMathRequest {
  readonly gradeBand: string
  readonly unitId: string
  readonly unitName: string
  readonly unitDescription: string
  readonly curriculumTag: string
  readonly difficulty: number
  readonly weakPoints?: readonly string[]
}

export interface AIMathProblem {
  readonly text: string
  readonly answer: number
  readonly hint: string
  readonly unitId: string
  readonly curriculumTag: string
}

export interface AIShopRequest {
  readonly stage: 'A' | 'B' | 'C'
  readonly difficulty: number
  readonly weakPoints?: readonly string[]
}

export interface AIShopQuestion {
  readonly description: string
  readonly answer: number
  readonly hint: string
  readonly options?: readonly number[]
}

export type AIFallbackReason =
  | 'no_passcode'
  | 'local_unit'
  | 'invalid_request'
  | 'timeout'
  | 'network'
  | 'bad_response'
  | `http_${number}`

export type AIResult<T> =
  | { readonly source: 'ai'; readonly data: T }
  | { readonly source: 'local'; readonly data: T; readonly reason: AIFallbackReason }

function apiUrl(path: string): string {
  return `${import.meta.env.BASE_URL}api/ai/${path}`
}

/** 截到最多 max 個 UTF-16 單位（伺服器用字串長度檢查），不切斷 emoji 這類由兩個單位組成的字 */
function clip(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  let out = ''
  for (const ch of trimmed) {
    if (out.length + ch.length > max) break
    out += ch
  }
  return out
}

function clampDifficulty(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(5, Math.max(1, Math.round(value)))
}

/** 弱點：選填，最多 5 個、每個 1～30 字；沒有就不送這個欄位 */
function weakPointsField(points?: readonly string[]): { weakPoints?: string[] } {
  const cleaned = (points ?? [])
    .map((p) => clip(p, 30))
    .filter((p) => p.length > 0)
    .slice(0, 5)
  return cleaned.length > 0 ? { weakPoints: cleaned } : {}
}

type Reply = { readonly status: number; readonly body: unknown } | { readonly failed: 'timeout' | 'network' }

/** 送出請求，最多等 8 秒；回應本文讀不成 JSON 時 body 是 undefined */
async function request(path: string, passcode: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<Reply> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, AI_CLIENT_TIMEOUT_MS)

  try {
    const headers: Record<string, string> = { 'X-Family-Passcode': passcode }
    if (init.body !== undefined) headers['Content-Type'] = 'application/json'
    const res = await fetch(apiUrl(path), {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    })
    let body: unknown
    try {
      body = await res.json()
    } catch {
      if (timedOut) return { failed: 'timeout' }
      body = undefined
    }
    return { status: res.status, body }
  } catch {
    return { failed: timedOut ? 'timeout' : 'network' }
  } finally {
    clearTimeout(timer)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null
}

function validAnswer(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1_000_000_000 ? value : null
}

/** 共用流程：沒通行碼不送；送出後只有 200 而且格式正確才採用，其他一律用本機題目 */
async function ask<T>(
  config: AIConfig | null,
  path: 'math' | 'shop',
  body: Record<string, unknown> | null,
  parse: (raw: unknown) => T | null,
  fallback: () => T,
): Promise<AIResult<T>> {
  const local = (reason: AIFallbackReason): AIResult<T> => {
    if (reason !== 'no_passcode' && reason !== 'local_unit') console.warn(`[AI 出題] 改用本機題目：${reason}`)
    return { source: 'local', data: fallback(), reason }
  }

  const passcode = config?.passcode
  if (!isValidPasscode(passcode)) return local('no_passcode')
  if (!body) return local('invalid_request')

  const reply = await request(path, passcode, { method: 'POST', body })
  if ('failed' in reply) return local(reply.failed)
  if (reply.status !== 200) return local(`http_${reply.status}`)
  const data = parse(reply.body)
  return data ? { source: 'ai', data } : local('bad_response')
}

const GRADE_BAND = /^grade-[1-6]$/
const UNIT_ID = /^[a-z0-9-]{1,40}$/
const CURRICULUM_TAG = /^[A-Za-z0-9-]{1,12}$/

/**
 * 分數類單元（編號含 frac：分數、分數乘法、分數除法）的答案常常不是單一整數，
 * 用「一個數字當答案」的問法容易彆扭，直接用本機題目
 */
function isLocalOnlyUnit(unitId: string): boolean {
  return unitId.includes('frac')
}

function mathBody(req: AIMathRequest): Record<string, unknown> | null {
  const unitName = clip(req.unitName, 20)
  if (!GRADE_BAND.test(req.gradeBand) || !UNIT_ID.test(req.unitId) || !CURRICULUM_TAG.test(req.curriculumTag) || !unitName) {
    return null
  }
  return {
    gradeBand: req.gradeBand,
    unitId: req.unitId,
    unitName,
    unitDescription: clip(req.unitDescription, 60),
    curriculumTag: req.curriculumTag,
    difficulty: clampDifficulty(req.difficulty),
    ...weakPointsField(req.weakPoints),
  }
}

export async function generateMathProblemWithAI(
  config: AIConfig | null,
  req: AIMathRequest,
  fallback: () => AIMathProblem,
): Promise<AIResult<AIMathProblem>> {
  if (isLocalOnlyUnit(req.unitId)) return { source: 'local', data: fallback(), reason: 'local_unit' }
  return ask(
    config,
    'math',
    mathBody(req),
    (raw) => {
      if (!isRecord(raw)) return null
      const text = nonEmptyText(raw.text, 300)
      const hint = nonEmptyText(raw.hint, 200)
      const answer = validAnswer(raw.answer)
      if (text === null || hint === null || answer === null) return null
      // 單元與課綱以請求為準，避免題目跑到別的單元
      return { text, answer, hint, unitId: req.unitId, curriculumTag: req.curriculumTag }
    },
    fallback,
  )
}

function shopOptions(value: unknown, answer: number): number[] | undefined | null {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) return null
  if (!value.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) return null
  const options = value as number[]
  if (new Set(options).size !== options.length || !options.includes(answer)) return null
  return options
}

export async function generateShopQuestionWithAI(
  config: AIConfig | null,
  req: AIShopRequest,
  fallback: () => AIShopQuestion,
): Promise<AIResult<AIShopQuestion>> {
  const body = ['A', 'B', 'C'].includes(req.stage)
    ? { stage: req.stage, difficulty: clampDifficulty(req.difficulty), ...weakPointsField(req.weakPoints) }
    : null
  return ask(
    config,
    'shop',
    body,
    (raw) => {
      if (!isRecord(raw)) return null
      const description = nonEmptyText(raw.description, 300)
      const hint = nonEmptyText(raw.hint, 200)
      const answer = validAnswer(raw.answer)
      if (description === null || hint === null || answer === null) return null
      const options = shopOptions(raw.options, answer)
      if (options === null) return null
      return options ? { description, answer, hint, options } : { description, answer, hint }
    },
    fallback,
  )
}

/** 家長區「檢查」的結果 */
export type AIStatusResult =
  | { readonly kind: 'ok'; readonly remainingToday: number; readonly dailyLimit: number }
  | { readonly kind: 'disabled' }
  | { readonly kind: 'wrong_passcode' }
  | { readonly kind: 'locked' }
  | { readonly kind: 'try_later' }
  | { readonly kind: 'daily_limit' }
  | { readonly kind: 'no_service' }

/** 問伺服器通行碼對不對、今天還能出幾題（不會呼叫模型） */
export async function checkAIStatus(passcode: string): Promise<AIStatusResult> {
  if (!isValidPasscode(passcode)) return { kind: 'wrong_passcode' }
  const reply = await request('status', passcode, { method: 'GET' })
  if ('failed' in reply) return { kind: 'no_service' }
  const body = isRecord(reply.body) ? reply.body : null
  if (reply.status === 200 && body && typeof body.enabled === 'boolean') {
    if (!body.enabled) return { kind: 'disabled' }
    const remainingToday = typeof body.remainingToday === 'number' ? body.remainingToday : 0
    const dailyLimit = typeof body.dailyLimit === 'number' ? body.dailyLimit : 0
    return { kind: 'ok', remainingToday, dailyLimit }
  }
  if (reply.status === 401) return { kind: 'wrong_passcode' }
  if (reply.status === 429) {
    if (body?.error === 'locked') return { kind: 'locked' }
    // 每分鐘上限或伺服器同時處理太多題：稍等就好
    if (body?.error === 'rate_limited' || body?.error === 'busy') return { kind: 'try_later' }
    if (body?.error === 'daily_limit') return { kind: 'daily_limit' }
  }
  // 其他：404（例如 GitHub 舊站沒有 AI 服務）、回網頁不是 JSON、連不上、伺服器沒設定好
  return { kind: 'no_service' }
}
