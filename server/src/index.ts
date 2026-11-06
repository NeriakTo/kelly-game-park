import { createServer } from 'node:http'
import { createApp } from './app.js'
const dailyLimit = Number(process.env.DAILY_LIMIT ?? 300)
const port = Number(process.env.PORT ?? 8080)
if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 0 || !Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid server configuration')
const app = createApp({
  passcodeHash: process.env.FAMILY_PASSCODE_SHA256, apiKey: process.env.ANTHROPIC_API_KEY,
  workspaceId: process.env.ANTHROPIC_WORKSPACE_ID, model: process.env.AI_MODEL,
  dailyLimit, dataDir: process.env.DATA_DIR ?? '/data', staticDir: process.env.STATIC_DIR ?? '/app/web',
})
const server = createServer(app.handler)
server.requestTimeout = 15000; server.headersTimeout = 10000
server.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ event: 'listening', port: (server.address() as { port: number }).port })))
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => { server.close(); server.closeIdleConnections() })
