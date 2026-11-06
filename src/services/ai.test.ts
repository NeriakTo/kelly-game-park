import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AI_CLIENT_TIMEOUT_MS,
  generateMathProblemWithAI,
  generateShopQuestionWithAI,
  type AIMathProblem,
  type AIMathRequest,
  type AIShopQuestion,
} from './ai'

// 出題改走網站自己的伺服器（伺服器再呼叫 Claude，金鑰只放伺服器）。
// 前端只送合約上的欄位、帶家用通行碼標頭；任何失敗一律安靜改用本機題目。
// fetch 一律是假的，不會連外。

const FAMILY = { passcode: 'family-test-2026' }
const MATH_URL = `${import.meta.env.BASE_URL}api/ai/math`
const SHOP_URL = `${import.meta.env.BASE_URL}api/ai/shop`

const LOCAL_MATH: AIMathProblem = { text: '本機題：3 × 4 = ?', answer: 12, hint: '本機提示', unitId: 'g3-multiply', curriculumTag: 'N-3-3' }
const LOCAL_SHOP: AIShopQuestion = { description: '本機商店題', answer: 20, hint: '本機提示', options: [10, 20, 30] }

const MATH_REQ: AIMathRequest = {
  gradeBand: 'grade-3',
  unitId: 'g3-multiply',
  unitName: '多位數乘法',
  unitDescription: '二三位數乘以一位數',
  curriculumTag: 'N-3-3',
  difficulty: 3,
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const AI_MATH_BODY = { text: 'AI 題：23 × 3 = ?', answer: 69, hint: '先算 20 × 3', unitId: 'g3-multiply', curriculumTag: 'N-3-3' }
const AI_SHOP_BODY = { description: 'AI 商店題：買兩個 15 元的蛋', answer: 30, hint: '15 + 15', options: [25, 30, 35] }

type FetchMock = ReturnType<typeof vi.fn>

function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response>): FetchMock {
  const mock = vi.fn(impl)
  vi.stubGlobal('fetch', mock)
  return mock
}

function sentBody(mock: FetchMock, call = 0): Record<string, unknown> {
  const init = mock.mock.calls[call][1] as RequestInit
  return JSON.parse(String(init.body))
}

function sentHeaders(mock: FetchMock, call = 0): Headers {
  return new Headers((mock.mock.calls[call][1] as RequestInit).headers)
}

describe('數學出題改接伺服器', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('呼叫 api/ai/math（POST）、帶通行碼標頭，本文只有合約上的欄位', async () => {
    const mock = stubFetch(async () => json(200, AI_MATH_BODY))
    const result = await generateMathProblemWithAI(FAMILY, MATH_REQ, () => LOCAL_MATH)

    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.mock.calls[0][0]).toBe(MATH_URL)
    expect((mock.mock.calls[0][1] as RequestInit).method).toBe('POST')
    expect(sentHeaders(mock).get('X-Family-Passcode')).toBe('family-test-2026')
    expect(sentHeaders(mock).get('Content-Type')).toMatch(/application\/json/)
    expect(Object.keys(sentBody(mock)).sort()).toEqual(
      ['curriculumTag', 'difficulty', 'gradeBand', 'unitDescription', 'unitId', 'unitName'],
    )
    expect(sentBody(mock)).toEqual(MATH_REQ)

    expect(result.source).toBe('ai')
    expect(result.data).toEqual(AI_MATH_BODY)
  })

  it('單元與課綱以請求為準（不用伺服器回來的值）', async () => {
    stubFetch(async () => json(200, { ...AI_MATH_BODY, unitId: 'g6-other', curriculumTag: 'X-9-9' }))
    const result = await generateMathProblemWithAI(FAMILY, MATH_REQ, () => LOCAL_MATH)
    expect(result.data.unitId).toBe('g3-multiply')
    expect(result.data.curriculumTag).toBe('N-3-3')
  })

  it('超過合約長度的欄位先截斷；難度收在 1～5 的整數；弱點最多 5 個、每個最多 30 字', async () => {
    const mock = stubFetch(async () => json(200, AI_MATH_BODY))
    await generateMathProblemWithAI(
      FAMILY,
      {
        ...MATH_REQ,
        unitName: '一二三四五六七八九十一二三四五六七八九十多出來的',
        unitDescription: '說'.repeat(75),
        difficulty: 9,
        weakPoints: ['進位', '借'.repeat(40), '直式', '對齊', '估算', '第六個', '第七個'],
      },
      () => LOCAL_MATH,
    )
    const body = sentBody(mock)
    expect(body.unitName).toBe('一二三四五六七八九十一二三四五六七八九十')
    expect(String(body.unitDescription)).toHaveLength(60)
    expect(body.difficulty).toBe(5)
    expect(body.weakPoints).toEqual(['進位', '借'.repeat(30), '直式', '對齊', '估算'])

    await generateMathProblemWithAI(FAMILY, { ...MATH_REQ, difficulty: 0 }, () => LOCAL_MATH)
    expect(sentBody(mock, 1).difficulty).toBe(1)
  })

  it.each([400, 401, 429, 502, 503, 504])('伺服器回 %i：安靜改用本機題目', async (status) => {
    stubFetch(async () => json(status, { error: 'whatever' }))
    const result = await generateMathProblemWithAI(FAMILY, MATH_REQ, () => LOCAL_MATH)
    expect(result.source).toBe('local')
    expect(result.data).toEqual(LOCAL_MATH)
  })

  it('網路錯誤：改用本機題目', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    const result = await generateMathProblemWithAI(FAMILY, MATH_REQ, () => LOCAL_MATH)
    expect(result.source).toBe('local')
    expect(result.data).toEqual(LOCAL_MATH)
  })

  it.each([
    ['回的是網頁不是 JSON', () => new Response('<!doctype html><title>x</title>', { status: 200 })],
    ['題目是空字串', () => json(200, { ...AI_MATH_BODY, text: '  ' })],
    ['答案不是數字', () => json(200, { ...AI_MATH_BODY, answer: '六十九' })],
    ['少了提示', () => json(200, { text: 'AI 題', answer: 1 })],
  ])('回傳格式不對（%s）：改用本機題目', async (_label, make) => {
    stubFetch(async () => make())
    const result = await generateMathProblemWithAI(FAMILY, MATH_REQ, () => LOCAL_MATH)
    expect(result.source).toBe('local')
    expect(result.data).toEqual(LOCAL_MATH)
  })

  it(`超過 ${AI_CLIENT_TIMEOUT_MS / 1000} 秒沒回應：中斷請求、改用本機題目`, async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const mock = stubFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    let settled = false
    const pending = generateMathProblemWithAI(FAMILY, MATH_REQ, () => LOCAL_MATH).then((r) => {
      settled = true
      return r
    })

    await vi.advanceTimersByTimeAsync(AI_CLIENT_TIMEOUT_MS - 1)
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    const result = await pending
    expect(AI_CLIENT_TIMEOUT_MS).toBe(8000)
    expect((mock.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal)
    expect(result.source).toBe('local')
    expect(result.data).toEqual(LOCAL_MATH)
  })

  it.each(['g3-fraction', 'g5-time-clock'])('分數與時間單元（%s）不呼叫伺服器', async (unitId) => {
    const mock = stubFetch(async () => json(200, AI_MATH_BODY))
    const result = await generateMathProblemWithAI(FAMILY, { ...MATH_REQ, unitId }, () => LOCAL_MATH)
    expect(mock).not.toHaveBeenCalled()
    expect(result.source).toBe('local')
  })

  it.each([
    ['沒有通行碼', null],
    ['通行碼是空的', { passcode: '' }],
    ['通行碼格式不對（有中文）', { passcode: '我家的通行碼1234' }],
  ])('%s：不呼叫伺服器', async (_label, config) => {
    const mock = stubFetch(async () => json(200, AI_MATH_BODY))
    const result = await generateMathProblemWithAI(config, MATH_REQ, () => LOCAL_MATH)
    expect(mock).not.toHaveBeenCalled()
    expect(result.source).toBe('local')
  })
})

describe('恐龍商店出題改接伺服器', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('呼叫 api/ai/shop（POST）、帶通行碼標頭，本文只有 stage、difficulty（與選填的 weakPoints）', async () => {
    const mock = stubFetch(async () => json(200, AI_SHOP_BODY))
    const result = await generateShopQuestionWithAI(FAMILY, { stage: 'B', difficulty: 2 }, () => LOCAL_SHOP)

    expect(mock.mock.calls[0][0]).toBe(SHOP_URL)
    expect((mock.mock.calls[0][1] as RequestInit).method).toBe('POST')
    expect(sentHeaders(mock).get('X-Family-Passcode')).toBe('family-test-2026')
    expect(sentBody(mock)).toEqual({ stage: 'B', difficulty: 2 })
    expect(result.source).toBe('ai')
    expect(result.data).toEqual(AI_SHOP_BODY)

    await generateShopQuestionWithAI(FAMILY, { stage: 'C', difficulty: 3, weakPoints: ['找錢'] }, () => LOCAL_SHOP)
    expect(Object.keys(sentBody(mock, 1)).sort()).toEqual(['difficulty', 'stage', 'weakPoints'])
  })

  it('選項沒有包含答案：當成格式不對，改用本機題目', async () => {
    stubFetch(async () => json(200, { ...AI_SHOP_BODY, options: [10, 20] }))
    const result = await generateShopQuestionWithAI(FAMILY, { stage: 'B', difficulty: 2 }, () => LOCAL_SHOP)
    expect(result.source).toBe('local')
    expect(result.data).toEqual(LOCAL_SHOP)
  })

  it.each([429, 502, 503])('伺服器回 %i：安靜改用本機題目', async (status) => {
    stubFetch(async () => json(status, { error: 'busy' }))
    const result = await generateShopQuestionWithAI(FAMILY, { stage: 'A', difficulty: 1 }, () => LOCAL_SHOP)
    expect(result.source).toBe('local')
    expect(result.data).toEqual(LOCAL_SHOP)
  })

  it('沒有通行碼：不呼叫伺服器', async () => {
    const mock = stubFetch(async () => json(200, AI_SHOP_BODY))
    const result = await generateShopQuestionWithAI(null, { stage: 'A', difficulty: 1 }, () => LOCAL_SHOP)
    expect(mock).not.toHaveBeenCalled()
    expect(result.source).toBe('local')
  })
})
