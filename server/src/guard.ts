import { createHash, timingSafeEqual } from 'node:crypto'
export function validPasscode(value: string, hash: string) {
  const actual = createHash('sha256').update(value).digest()
  const expected = Buffer.from(hash, 'hex')
  return expected.length === actual.length && timingSafeEqual(actual, expected)
}
type Source = { failures: number[]; requests: number[]; lockedUntil: number }
export class Guard {
  private sources = new Map<string, Source>()
  private lastCleanup = 0
  constructor(private now: () => number) {}
  source(id: string) {
    const time = this.now()
    if (time - this.lastCleanup >= 60000) {
      for (const [key, row] of this.sources) if (row.lockedUntil <= time && row.failures.every(t => t <= time - 600000) && row.requests.every(t => t <= time - 60000)) this.sources.delete(key)
      this.lastCleanup = time
    }
    let row = this.sources.get(id)
    if (!row) { row = { failures: [], requests: [], lockedUntil: 0 }; this.sources.set(id, row) }
    row.failures = row.failures.filter(t => t > time - 600000)
    row.requests = row.requests.filter(t => t > time - 60000)
    return row
  }
  locked(id: string) { return this.source(id).lockedUntil > this.now() }
  fail(id: string) {
    const row = this.source(id); row.failures.push(this.now())
    if (row.failures.length >= 10) { row.lockedUntil = this.now() + 900000; row.failures = [] }
  }
  limited(id: string) {
    const row = this.source(id)
    if (row.requests.length >= 20) return true
    row.requests.push(this.now()); return false
  }
}
