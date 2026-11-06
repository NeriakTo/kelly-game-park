import type { GameType } from '../types'
import type { Level } from '../data/levels'

// 目前正在玩哪個遊戲的哪一關。遊戲記成績時（gameStore.addScore）用它補上關卡，
// 家長區的學習紀錄才能顯示「數獨・簡單」而不是內部難度數字。遊戲本身不必改。

let current: { game: GameType; level: Level } | null = null

export function setActiveSession(session: { game: GameType; level: Level } | null): void {
  current = session
}

export function getActiveSession(): { game: GameType; level: Level } | null {
  return current
}
