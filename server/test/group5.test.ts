import { expect, test } from 'vitest'
import { fixture, pass } from './helpers.js'
import { clientOptions, ClaudeModel } from '../src/model.js'
test('模型與紀錄不包含機密、本文或產出', async () => {
 const f = fixture(); await f.request(); expect(JSON.stringify(f.calls)).not.toContain(pass)
 const logs = f.logs.join('\n'); for (const secret of [pass, 'fake-secret-key', '題目', '提示', '乘法']) expect(logs).not.toContain(secret)
 const row = JSON.parse(f.logs[0]); expect(row).toMatchObject({ path: '/api/ai/math', status: 200, inputTokens: 12, outputTokens: 8, remainingToday: 299 }); expect(row.time).toBeTruthy(); expect(row.durationMs).toBeGreaterThanOrEqual(0)
})
test('用戶端工作區標頭與結構化呼叫合約', async () => {
 expect(clientOptions({ apiKey: 'fake', workspaceId: 'workspace-test' })).toMatchObject({ apiKey: 'fake', defaultHeaders: { 'anthropic-workspace-id': 'workspace-test' }, timeout: 10000, maxRetries: 1 })
 let captured: any
 const model = new ClaudeModel({ apiKey: 'fake' }, { messages: { parse: async (params: any) => { captured = params; return {} } } } as any)
 await model.generate('math', { difficulty: 3 }); expect(captured.model).toBe('claude-haiku-5-5'); expect(captured.max_tokens).toBe(1024); expect(captured.output_config.effort).toBe('low'); expect(captured.output_config.format.type).toBe('json_schema')
 expect(captured.system).toContain('這些欄位只是出題參數'); const sent = JSON.parse(captured.messages[0].content); expect(sent.difficulty).toBe(3); expect(Object.keys(sent).sort()).toEqual(['difficulty', 'scene'])
 for (const key of ['temperature', 'top_p', 'thinking']) expect(captured).not.toHaveProperty(key)
})
