import { randomInt as cryptoRandomInt } from 'node:crypto'
import { z } from 'zod'
const difficulty = z.number().int().min(1).max(5)
const weakPoints = z.array(z.string().min(1).max(30)).max(5).optional()
export const mathRequest = z.strictObject({
  gradeBand: z.enum(['grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6']),
  unitId: z.string().regex(/^[a-z0-9-]{1,40}$/), unitName: z.string().min(1).max(20),
  unitDescription: z.string().max(60), curriculumTag: z.string().regex(/^[A-Za-z0-9-]{1,12}$/),
  difficulty, weakPoints,
})
export const shopRequest = z.strictObject({ stage: z.enum(['A', 'B', 'C']), difficulty, theme: z.string().min(1).max(20).optional(), weakPoints })
const answer = z.number().min(-1_000_000_000).max(1_000_000_000)
const hint = z.string().trim().min(1).max(200)
export const mathOutput = z.object({ text: z.string().trim().min(1).max(300), answer, hint })
export const shopOutput = z.object({
  description: z.string().trim().min(1).max(300), answer, hint,
  options: z.array(z.number().min(0)).min(2).max(6).optional(),
})
export type Kind = 'math' | 'shop'
function checkHint(data: { answer: number; hint: string }, text: string) {
  const number = String(data.answer).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const standalone = new RegExp(`(?<![\\d.])${number}(?![\\d.])`)
  // 答案已經寫在題目裡等於照抄，孩子不用算；退回改用本機題目。
  if (standalone.test(text)) throw new Error('trivial question')
  if (standalone.test(data.hint)) throw new Error('invalid hint')
}
export function normalize(kind: Kind, output: unknown, input: Record<string, unknown>, randomInt: (max: number) => number = cryptoRandomInt) {
  if (kind === 'math') {
    const data = mathOutput.parse(output)
    checkHint(data, data.text)
    return { ...data, unitId: input.unitId, curriculumTag: input.curriculumTag }
  }
  const data = shopOutput.parse(output)
  checkHint(data, data.description)
  if (data.options) {
    if (data.answer < 0) throw new Error('invalid options')
    data.options = [data.answer, ...new Set(data.options.filter(n => n !== data.answer))].slice(0, 6)
    if (data.options.length < 2) throw new Error('invalid options')
    for (let i = data.options.length - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[data.options[i], data.options[j]] = [data.options[j], data.options[i]]
    }
  }
  return data
}
