import type { GameType } from '../types'

// 7 個遊戲的中文名稱、分區與「怎麼玩」說明。首頁卡片、遊戲外框、家長區學習紀錄共用這份。

export type Zone = 'board' | 'brain' | 'math' | 'typing'

export interface GameEntry {
  readonly id: GameType
  readonly name: string
  readonly zone: Zone
  /** 首頁卡片上名稱下面那行小字 */
  readonly tagline: string
  /** 「怎麼玩」說明，每行一句 */
  readonly howTo: readonly string[]
  /** 要實體鍵盤才能玩（打字） */
  readonly needsKeyboard?: boolean
}

export const GAMES: Record<GameType, GameEntry> = {
  chess: {
    id: 'chess',
    name: '象棋',
    zone: 'board',
    tagline: '和松松下一盤',
    howTo: ['你是紅色的棋，先走。', '點一下自己的棋子，再點要走去的地方。', '把對方的「將」困住就贏了。'],
  },
  go: {
    id: 'go',
    name: '圍棋',
    zone: 'board',
    tagline: '一課一課學',
    howTo: ['可以先上課，也可以直接下一盤。', '棋子放在線的交叉點上。', '把對方的棋子圍起來就能吃掉。'],
  },
  sudoku: {
    id: 'sudoku',
    name: '數獨',
    zone: 'brain',
    tagline: '填數字',
    howTo: ['點一個空格，再點下面的數字。', '每一橫排、每一直排、每個九宮格裡，1 到 9 都只能出現一次。'],
  },
  memory: {
    id: 'memory',
    name: '記憶翻牌',
    zone: 'brain',
    tagline: '找出一樣的牌',
    howTo: ['一次翻開兩張牌。', '兩張一樣就留著，不一樣會蓋回去。', '記住牌的位置，全部配對就過關。'],
  },
  math: {
    id: 'math',
    name: '數學挑戰',
    zone: 'math',
    tagline: '算算看',
    howTo: ['先選一個單元。', '看完題目，點下面正確的答案。', '一回合有 10 題，卡住可以按「看提示」。'],
  },
  'dino-shop': {
    id: 'dino-shop',
    name: '恐龍商店',
    zone: 'math',
    tagline: '用錢買東西',
    howTo: ['聽店長說要買什麼。', '點硬幣付錢，或選出正確的答案。', '連續答對 3 題可以拿到一片化石。'],
  },
  typing: {
    id: 'typing',
    name: '練打字',
    zone: 'typing',
    tagline: '用筆電玩',
    howTo: ['手指放在鍵盤中間那排。', '照著畫面上亮起來的鍵按下去。', '這個遊戲要用有鍵盤的筆電玩。'],
    needsKeyboard: true,
  },
}

export const GAME_IDS = Object.keys(GAMES) as GameType[]

export function isGameType(value: string): value is GameType {
  return value in GAMES
}

export function gameName(id: string): string {
  return isGameType(id) ? GAMES[id].name : id
}
