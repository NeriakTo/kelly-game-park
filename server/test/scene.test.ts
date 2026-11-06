import { describe, expect, it } from 'vitest'
import { ClaudeModel, scenes } from '../src/model.js'
import { math } from './helpers.js'
function fakeClient(sent: any[]) {
  return { messages: { parse: async (params: any) => { sent.push(params); return { stop_reason: 'end_turn', parsed_output: null } } } } as any
}
describe('出題情境', () => {
  it('每次在請求參數之外加一個隨機情境，原本欄位不變', async () => {
    const sent: any[] = []
    const model = new ClaudeModel({ apiKey: 'k' }, fakeClient(sent), () => 2)
    await model.generate('math', math)
    const content = JSON.parse(sent[0].messages[0].content)
    expect(content.scene).toBe(scenes[2])
    expect({ ...content, scene: undefined }).toEqual({ ...math, scene: undefined })
  })
  it('預設亂數會用到多種情境', async () => {
    const sent: any[] = []
    const model = new ClaudeModel({ apiKey: 'k' }, fakeClient(sent))
    for (let i = 0; i < 40; i++) await model.generate('shop', { stage: 'A', difficulty: 1 })
    expect(new Set(sent.map(p => JSON.parse(p.messages[0].content).scene)).size).toBeGreaterThanOrEqual(3)
  })
})
