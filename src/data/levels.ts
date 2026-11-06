// 選關的三段：簡單、普通、挑戰。各遊戲怎麼對應到自己原本的難度參數，見 levelMap.ts。

export type Level = 'easy' | 'normal' | 'hard'

export const LEVELS: readonly Level[] = ['easy', 'normal', 'hard']

export const LEVEL_LABEL: Record<Level, string> = {
  easy: '簡單',
  normal: '普通',
  hard: '挑戰',
}

export function isLevel(value: string | undefined): value is Level {
  return value === 'easy' || value === 'normal' || value === 'hard'
}

export function nextLevel(level: Level): Level | null {
  const i = LEVELS.indexOf(level)
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null
}
