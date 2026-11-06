import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })
export class Usage {
  private state: { day: string; count: number }
  private file: string
  constructor(private dir: string, private now: () => number, private limit: number) {
    mkdirSync(dir, { recursive: true }); this.file = join(dir, 'usage.json')
    this.state = { day: dayFormat.format(now()), count: 0 }
    if (existsSync(this.file)) {
      const data = JSON.parse(readFileSync(this.file, 'utf8'))
      if (typeof data.day !== 'string' || !Number.isSafeInteger(data.count) || data.count < 0) throw new Error('Invalid usage store')
      this.state = data
    }
  }
  remaining() { this.refresh(); return Math.max(0, this.limit - this.state.count) }
  private refresh() {
    const day = dayFormat.format(this.now())
    if (this.state.day !== day) this.state = { day, count: 0 }
  }
  consume() {
    this.refresh()
    const next = { ...this.state, count: this.state.count + 1 }
    const temp = join(this.dir, `.usage-${randomUUID()}.tmp`)
    writeFileSync(temp, JSON.stringify(next), { mode: 0o600 })
    renameSync(temp, this.file)
    this.state = next
  }
}
