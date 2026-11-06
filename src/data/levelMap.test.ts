import { describe, it, expect } from 'vitest'
import { LEVEL_DIFFICULTY, MATH_LEVEL_EASING, levelToDifficulty } from './levelMap'
import { LEVELS } from './levels'

// 選關三段（簡單、普通、挑戰）對到各遊戲原本的難度參數（1 到 5）。
// 這張表就是施工報告裡的對照表；改表要一起改報告。

describe('選關三段對照表', () => {
  it('六個用難度參數的遊戲，三段各自對到指定的難度', () => {
    expect(LEVEL_DIFFICULTY).toEqual({
      sudoku: { easy: 1, normal: 2, hard: 3 },
      chess: { easy: 1, normal: 3, hard: 4 },
      memory: { easy: 1, normal: 2, hard: 3 },
      typing: { easy: 1, normal: 2, hard: 3 },
      'dino-shop': { easy: 1, normal: 2, hard: 3 },
      go: { easy: 1, normal: 2, hard: 3 },
    })
  })

  it('每個遊戲的三段由易到難、不重複', () => {
    for (const [game, table] of Object.entries(LEVEL_DIFFICULTY)) {
      const values = LEVELS.map((l) => table[l])
      expect(values, game).toEqual([...values].sort((a, b) => a - b))
      expect(new Set(values).size, game).toBe(3)
    }
  })

  it('象棋的普通不會跟簡單一樣（引擎的難度 1、2 完全相同，所以普通對到 3）', () => {
    expect(levelToDifficulty('chess', 'easy')).toBe(1)
    expect(levelToDifficulty('chess', 'normal')).toBe(3)
  })

  it('數學不用難度參數：年級由家長區設定，三段改變「簡單題」的用法', () => {
    expect(MATH_LEVEL_EASING).toEqual({
      easy: 'always',
      normal: 'after-two-wrong',
      hard: 'never',
    })
  })
})
