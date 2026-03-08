import type { AIConfig, Difficulty } from '../types'

export interface AIMathRequest {
  readonly gradeBand: string
  readonly unitId: string
  readonly difficulty: Difficulty
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
  readonly difficulty: Difficulty
  readonly theme?: string
  readonly weakPoints?: readonly string[]
}

export interface AIShopQuestion {
  readonly description: string
  readonly answer: number
  readonly hint: string
  readonly options?: readonly number[]
}

export type AIResult<T> =
  | { source: 'ai'; data: T }
  | { source: 'local'; data: T; reason: string }

const AI_TIMEOUT_MS = 6000

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeOptions(options?: readonly number[]): number[] | undefined {
  if (!options || options.length === 0) return undefined
  const deduped = Array.from(new Set(options.filter((n) => isFiniteNumber(n) && n >= 0)))
  return deduped.length > 0 ? deduped : undefined
}

function isMathProblem(value: unknown): value is AIMathProblem {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    isNonEmptyString(v.text) &&
    isFiniteNumber(v.answer) &&
    Math.abs(v.answer) <= 1_000_000_000 &&
    isNonEmptyString(v.hint) &&
    isNonEmptyString(v.unitId) &&
    isNonEmptyString(v.curriculumTag)
  )
}

function sanitizeMathProblem(value: AIMathProblem, req: AIMathRequest): AIMathProblem {
  return {
    text: value.text.trim(),
    answer: Number(value.answer),
    hint: value.hint.trim(),
    // 以請求中的 unitId 為主，避免 AI 回傳跨單元題目
    unitId: req.unitId,
    curriculumTag: value.curriculumTag.trim(),
  }
}

function isShopQuestion(value: unknown): value is AIShopQuestion {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>

  const options = Array.isArray(v.options) ? v.options : undefined
  const optionsOk =
    options === undefined ||
    (options.length >= 2 && options.length <= 6 && options.every((n) => isFiniteNumber(n) && n >= 0))

  return (
    isNonEmptyString(v.description) &&
    isFiniteNumber(v.answer) &&
    Math.abs(v.answer) <= 1_000_000_000 &&
    isNonEmptyString(v.hint) &&
    optionsOk
  )
}

function sanitizeShopQuestion(value: AIShopQuestion): AIShopQuestion {
  const cleanedOptions = normalizeOptions(value.options)
  const answer = Number(value.answer)

  if (!cleanedOptions) {
    return {
      description: value.description.trim(),
      answer,
      hint: value.hint.trim(),
      options: undefined,
    }
  }

  const optionsWithAnswer = cleanedOptions.includes(answer)
    ? cleanedOptions
    : [...cleanedOptions, answer]

  return {
    description: value.description.trim(),
    answer,
    hint: value.hint.trim(),
    options: optionsWithAnswer.slice(0, 6),
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function detectProviderReason(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') return 'provider_timeout'
  if (error instanceof Error && /AbortError|timed out|timeout/i.test(error.message)) return 'provider_timeout'
  return 'provider_error'
}

async function callOpenAI(config: AIConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    },
    AI_TIMEOUT_MS,
  )

  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`)
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI empty response')
  return content
}

async function callGemini(config: AIConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(config.apiKey)}`
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.8,
          responseMimeType: 'application/json',
        },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      }),
    },
    AI_TIMEOUT_MS,
  )

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
  const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error('Gemini empty response')
  return content
}

async function callAI(config: AIConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  if (config.provider === 'openai') return callOpenAI(config, systemPrompt, userPrompt)
  return callGemini(config, systemPrompt, userPrompt)
}

export async function generateMathProblemWithAI(
  config: AIConfig | null,
  req: AIMathRequest,
  fallback: () => AIMathProblem,
): Promise<AIResult<AIMathProblem>> {
  if (!config?.apiKey?.trim()) {
    return { source: 'local', data: fallback(), reason: 'missing_api_key' }
  }

  const systemPrompt =
    '你是兒童數學出題助手。輸出必須是 JSON，且只輸出單一題。題目需正向鼓勵、繁體中文、不可超齡。'
  const userPrompt = JSON.stringify({
    task: 'generate_math_problem',
    request: req,
    schema: {
      text: 'string',
      answer: 'number',
      hint: 'string',
      unitId: 'string',
      curriculumTag: 'string',
    },
  })

  try {
    const raw = await callAI(config, systemPrompt, userPrompt)
    const parsed = safeJsonParse<unknown>(raw)
    if (!isMathProblem(parsed)) {
      return { source: 'local', data: fallback(), reason: 'invalid_schema' }
    }
    return { source: 'ai', data: sanitizeMathProblem(parsed, req) }
  } catch (error) {
    return { source: 'local', data: fallback(), reason: detectProviderReason(error) }
  }
}

export async function generateShopQuestionWithAI(
  config: AIConfig | null,
  req: AIShopRequest,
  fallback: () => AIShopQuestion,
): Promise<AIResult<AIShopQuestion>> {
  if (!config?.apiKey?.trim()) {
    return { source: 'local', data: fallback(), reason: 'missing_api_key' }
  }

  const systemPrompt =
    '你是兒童商店數學出題助手。輸出必須是 JSON，題目情境要可愛、清楚、可計算。'
  const userPrompt = JSON.stringify({
    task: 'generate_shop_question',
    request: req,
    schema: {
      description: 'string',
      answer: 'number',
      hint: 'string',
      options: 'number[] (optional)',
    },
  })

  try {
    const raw = await callAI(config, systemPrompt, userPrompt)
    const parsed = safeJsonParse<unknown>(raw)
    if (!isShopQuestion(parsed)) {
      return { source: 'local', data: fallback(), reason: 'invalid_schema' }
    }
    return { source: 'ai', data: sanitizeShopQuestion(parsed) }
  } catch (error) {
    return { source: 'local', data: fallback(), reason: detectProviderReason(error) }
  }
}
