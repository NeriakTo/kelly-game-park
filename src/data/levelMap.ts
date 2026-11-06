import type { Difficulty, GameType } from '../types'
import type { Level } from './levels'

// 選關三段（簡單、普通、挑戰）對到各遊戲原本的難度參數。遊戲內部玩法這次不改，只換「誰決定難度」：
// 以前是全站一個五段難度（國小低年級到高中），現在是每個遊戲進場前自己選。

type DifficultyGame = Exclude<GameType, 'math'>

export const LEVEL_DIFFICULTY: Record<DifficultyGame, Record<Level, Difficulty>> = {
  // 挖空格數：22、32、38 格
  sudoku: { easy: 1, normal: 2, hard: 3 },
  // 引擎的難度 1、2 完全一樣（搜尋 1 層、七成隨機），所以普通跳到 3（搜尋 2 層、三成五隨機），挑戰 4（搜尋 2 層、不隨機）
  chess: { easy: 1, normal: 3, hard: 4 },
  // 4、6、8 對牌
  memory: { easy: 1, normal: 2, hard: 3 },
  // 文章練習的長度；鍵位課程不分難度
  typing: { easy: 1, normal: 2, hard: 3 },
  // 題型池：1＝認錢幣與單品付款，2＝多品合計與預算，3＝打折與多步驟
  'dino-shop': { easy: 1, normal: 2, hard: 3 },
  // 電腦：1＝隨機落子，2＝先吃子再救子，3＝位置評分；圍棋課程不分難度
  go: { easy: 1, normal: 2, hard: 3 },
}

/**
 * 數學沒有用難度參數，題目看年級（家長區設定）。三段改變「簡單題」（數字小一點的同單元題目）的用法：
 * 簡單＝一律出簡單題；普通＝跟原本一樣，連錯 2 題自動改出簡單題；挑戰＝一律正常題，不會自動變簡單。
 */
export type MathEasing = 'always' | 'after-two-wrong' | 'never'

export const MATH_LEVEL_EASING: Record<Level, MathEasing> = {
  easy: 'always',
  normal: 'after-two-wrong',
  hard: 'never',
}

/**
 * 數學 AI 出題送給伺服器的難度（1～5）：簡單 2、普通 3、挑戰 4；要出「簡單題」時再降一級。
 * 所以簡單關一律是 1（簡單關都出簡單題），普通關平常 3、連錯兩題後 2，挑戰關一律 4。
 */
export const MATH_AI_DIFFICULTY: Record<Level, number> = { easy: 2, normal: 3, hard: 4 }

export function mathAIDifficulty(level: Level, easy: boolean): number {
  return Math.max(1, MATH_AI_DIFFICULTY[level] - (easy ? 1 : 0))
}

export function levelToDifficulty(game: GameType, level: Level): Difficulty {
  if (game === 'math') return 1
  return LEVEL_DIFFICULTY[game][level]
}

/** 孩子在選關畫面看到的一句話 */
export const LEVEL_KID_HINT: Record<GameType, Record<Level, string>> = {
  sudoku: { easy: '空 22 格', normal: '空 32 格', hard: '空 38 格' },
  chess: { easy: '松松隨便下', normal: '松松會想一想', hard: '松松很認真' },
  memory: { easy: '4 對牌', normal: '6 對牌', hard: '8 對牌' },
  typing: { easy: '短短一句', normal: '長一點', hard: '再長一點' },
  math: { easy: '數字小一點', normal: '跟課本一樣', hard: '全部是正常題' },
  'dino-shop': { easy: '一次買一樣', normal: '一次買好幾樣', hard: '打折和多步驟' },
  go: { easy: '白棋亂亂下', normal: '白棋會吃子', hard: '白棋會搶好位置' },
}

/** 家長區「各遊戲難度」裡的說明 */
export const LEVEL_PARENT_NOTE: Record<GameType, Record<Level, string>> = {
  sudoku: { easy: '挖空 22 格', normal: '挖空 32 格', hard: '挖空 38 格' },
  chess: {
    easy: '電腦看 1 步，七成亂走',
    normal: '電腦看 2 步，三成五亂走',
    hard: '電腦看 2 步，不亂走',
  },
  memory: { easy: '4 對牌', normal: '6 對牌', hard: '8 對牌' },
  typing: { easy: '文章最短', normal: '文章中等', hard: '文章較長（鍵位課程不分難度）' },
  math: {
    easy: '一律出簡單題',
    normal: '連錯 2 題自動改出簡單題（原本的做法）',
    hard: '一律正常題，不自動變簡單',
  },
  'dino-shop': { easy: '認錢幣、單品付款', normal: '多品合計、預算', hard: '打折、多步驟、限時' },
  go: { easy: '電腦隨機下', normal: '電腦先吃子再救子', hard: '電腦會評估位置（課程不分難度）' },
}
