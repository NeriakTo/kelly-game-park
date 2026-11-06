import type { Problem } from './generators'

// 數學挑戰的學習紀錄（錯題本、各單元作答統計），存在本機儲存。
// 遊戲本身會寫入；家長區的學習紀錄只讀出來顯示，所以抽成獨立檔案，家長區不必載入整個遊戲。

export type UnitStat = {
  attempts: number
  correct: number
  lastAt?: string
}

export const WRONG_BOOK_KEY = 'kelly-math-wrong-book-v2'
export const UNIT_STATS_KEY = 'kelly-math-unit-stats-v1'

export function loadWrongBook(): Record<string, Problem[]> {
  try {
    const raw = localStorage.getItem(WRONG_BOOK_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveWrongBook(book: Record<string, Problem[]>) {
  try {
    localStorage.setItem(WRONG_BOOK_KEY, JSON.stringify(book))
  } catch {}
}

export function loadUnitStats(): Record<string, UnitStat> {
  try {
    const raw = localStorage.getItem(UNIT_STATS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveUnitStats(stats: Record<string, UnitStat>) {
  try {
    localStorage.setItem(UNIT_STATS_KEY, JSON.stringify(stats))
  } catch {}
}

/** 正確率對應的學習狀態，與原本數學頁「學習地圖」的分級相同 */
export function unitStatus(stat: UnitStat | undefined): { acc: number; status: string } {
  const attempts = stat?.attempts ?? 0
  const acc = attempts === 0 ? 0 : Math.round(((stat?.correct ?? 0) / attempts) * 100)
  const status = attempts === 0 ? '未開始' : acc >= 85 ? '已熟練' : acc >= 65 ? '練習中' : '待加強'
  return { acc, status }
}
