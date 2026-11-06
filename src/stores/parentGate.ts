// 家長區的門：長按 3 秒或答對一題兩位數乘法才開；開了以後 10 分鐘內不用再驗。
// 開門時間存在本機儲存，重新整理或回首頁再進來都算數。

const UNLOCK_KEY = 'kelly-game-park-parent-unlock'

export const HOLD_TO_OPEN_MS = 3000
export const PARENT_UNLOCK_MS = 10 * 60 * 1000

export function isParentUnlocked(now: number = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY)
    if (!raw) return false
    const until = Number(raw)
    return Number.isFinite(until) && now < until
  } catch {
    return false
  }
}

export function unlockParent(now: number = Date.now()): void {
  try {
    localStorage.setItem(UNLOCK_KEY, String(now + PARENT_UNLOCK_MS))
  } catch {
    // 無法寫入本機儲存（例如私密瀏覽）時，本次仍放行，只是下次要重新驗證
  }
}

export function lockParent(): void {
  try {
    localStorage.removeItem(UNLOCK_KEY)
  } catch {
    // 同上，寫不進去就算了
  }
}

export interface GateQuestion {
  readonly a: number
  readonly b: number
  readonly answer: number
}

/** 兩位數乘兩位數，避開 10、20 這種太好算的整十數 */
export function makeGateQuestion(random: () => number = Math.random): GateQuestion {
  const pickTwoDigit = () => {
    let n = 0
    do {
      n = 12 + Math.floor(random() * 88)
    } while (n % 10 === 0)
    return n
  }
  const a = pickTwoDigit()
  const b = pickTwoDigit()
  return { a, b, answer: a * b }
}
